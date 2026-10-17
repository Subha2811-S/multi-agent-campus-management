
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Faculty = {
  _id: string;
  name: string;
  department: string;
  subjects: string[];
  email?: string;
  isAvailable: boolean;
  weeklyWorkload: number;
};

const API = "http://localhost:5000/api/faculty";

const emptyForm = {
  name: "",
  department: "Computer Science",
  subjects: "Python, Machine Learning, Reinforcement Learning",
  email: "",
  isAvailable: true,
  weeklyWorkload: 0,
};

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFaculty = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load faculty");
      }

      setFaculty(data);
    } catch {
      setError("Faculty load aagala. Backend server running-ah irukka nu check pannu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFaculty();
  }, [loadFaculty]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const subjects = form.subjects
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    if (form.name.trim().length < 3) {
      setError("Faculty name must contain at least 3 characters.");
      return;
    }

    if (!form.department.trim() || subjects.length === 0) {
      setError("Department and at least one subject are required.");
      return;
    }

    if (form.weeklyWorkload < 0 || form.weeklyWorkload > 60) {
      setError("Weekly workload must be between 0 and 60 hours.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            department: form.department.trim(),
            subjects,
            email: form.email.trim() || undefined,
            isAvailable: form.isAvailable,
            weeklyWorkload: Number(form.weeklyWorkload),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save faculty");
      }

      setMessage(editingId ? "Faculty updated successfully!" : "Faculty added successfully!");
      resetForm();
      await loadFaculty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(person: Faculty) {
    setEditingId(person._id);
    setForm({
      name: person.name,
      department: person.department,
      subjects: person.subjects.join(", "),
      email: person.email || "",
      isAvailable: person.isAvailable,
      weeklyWorkload: person.weeklyWorkload,
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteFaculty(person: Faculty) {
    if (!window.confirm(`Delete ${person.name} from faculty records?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/${person._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete faculty");
      }

      setMessage("Faculty deleted successfully!");

      if (editingId === person._id) {
        resetForm();
      }

      await loadFaculty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const filteredFaculty = faculty.filter((person) =>
    [person.name, person.department, ...person.subjects]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-blue-600">
            CAMPUS MANAGEMENT SYSTEM
          </p>
          <h1 className="mt-1 text-3xl font-bold">👩‍🏫 Faculty Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sri Ramachandra Faculty of Engineering and Technology · Computer Science
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Faculty</p>
            <p className="mt-2 text-3xl font-bold">{faculty.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Available Faculty</p>
            <p className="mt-2 text-3xl font-bold">
              {faculty.filter((person) => person.isAvailable).length}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Departments</p>
            <p className="mt-2 text-3xl font-bold">
              {new Set(faculty.map((person) => person.department)).size}
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">
            {editingId ? "✏️ Edit Faculty" : "➕ Add New Faculty"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Faculty Name *
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter faculty name"
                required
                minLength={3}
              />
            </label>

            <label className="text-sm font-medium">
              Department *
              <input
                className={inputClass}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Enter department"
                required
              />
            </label>

            <label className="text-sm font-medium sm:col-span-2">
              Subjects * <span className="font-normal text-gray-500">(comma separated)</span>
              <input
                className={inputClass}
                value={form.subjects}
                onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                placeholder="Python, Machine Learning, RL"
                required
              />
            </label>

            <label className="text-sm font-medium">
              Email (optional)
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="faculty@example.com"
              />
            </label>

            <label className="text-sm font-medium">
              Weekly Workload (hours)
              <input
                className={inputClass}
                type="number"
                min={0}
                max={60}
                value={form.weeklyWorkload}
                onChange={(e) =>
                  setForm({ ...form, weeklyWorkload: Number(e.target.value) })
                }
              />
            </label>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="h-4 w-4"
              />
              Faculty is currently available
            </label>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700 sm:col-span-2">
                {message}
              </p>
            )}

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Faculty" : "Add Faculty"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border px-5 py-2.5 font-semibold hover:bg-gray-100"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Faculty Records</h2>
              <p className="mt-1 text-sm text-gray-500">
                Records loaded from your backend database
              </p>
            </div>

            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 sm:max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty..."
              aria-label="Search faculty"
            />
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading faculty...</p>
          ) : filteredFaculty.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No faculty records found. Add a faculty member using the form above.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {filteredFaculty.map((person) => (
                <article
                  key={person._id}
                  className="rounded-xl border p-4 transition hover:border-blue-300 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">{person.name}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            person.isAvailable
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {person.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">{person.department}</p>
                      <p className="mt-2 text-sm">
                        <span className="font-semibold">Subjects:</span>{" "}
                        {person.subjects.join(", ")}
                      </p>
                      {person.email && (
                        <p className="mt-1 break-all text-sm text-gray-600">
                          {person.email}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-600">
                        Weekly workload: {person.weeklyWorkload} hours
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(person)}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteFaculty(person)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => void loadFaculty()}
            className="mt-5 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
          >
            Refresh Records
          </button>
        </section>
      </div>
    </main>
  );
}
