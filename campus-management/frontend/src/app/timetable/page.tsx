
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TimetableEntry = {
  _id: string;
  day: string;
  subject: string;
  faculty: string;
  classroom: string;
  department: string;
  startTime: string;
  endTime: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EMPTY_FORM = {
  day: "Monday",
  subject: "",
  faculty: "",
  classroom: "",
  department: "",
  startTime: "09:00",
  endTime: "10:00",
};

const API_URL =
  typeof process.env.NEXT_PUBLIC_API_URL === "string" &&
  process.env.NEXT_PUBLIC_API_URL.trim()
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/api/timetable`
    : typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:5000/api/timetable`
      : "http://localhost:5000/api/timetable";

function overlaps(a: TimetableEntry, b: TimetableEntry) {
  return a.day === b.day &&
    a.startTime < b.endTime &&
    b.startTime < a.endTime;
}

function getConflict(entry: TimetableEntry, entries: TimetableEntry[]) {
  return entries.find(
    (other) =>
      other._id !== entry._id &&
      overlaps(entry, other) &&
      (other.faculty.trim().toLowerCase() === entry.faculty.trim().toLowerCase() ||
        other.classroom.trim().toLowerCase() === entry.classroom.trim().toLowerCase())
  );
}

export default function TimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [facultyFilter, setFacultyFilter] = useState("All");
  const [classroomFilter, setClassroomFilter] = useState("All");
  const [dayFilter, setDayFilter] = useState("All");

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Timetable API is not implemented yet on the backend."
            : `Server returned ${response.status}.`
        );
      }

      const data: unknown = await response.json();
      const list = Array.isArray(data)
        ? data
        : data &&
            typeof data === "object" &&
            "data" in data &&
            Array.isArray(data.data)
          ? data.data
          : null;

      if (!list) {
        throw new Error("Unexpected API response. Expected a timetable array.");
      }

      setEntries(list as TimetableEntry[]);
    } catch (err) {
      setEntries([]);
      setError(
        err instanceof TypeError
          ? `Cannot reach ${API_URL}. Check the backend is running and CORS allows this frontend origin.`
          : err instanceof Error
            ? err.message
            : "Could not load timetable."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimetable();
  }, [loadTimetable]);

  const departments = useMemo(
    () => [...new Set(entries.map((e) => e.department).filter(Boolean))].sort(),
    [entries]
  );
  const faculties = useMemo(
    () => [...new Set(entries.map((e) => e.faculty).filter(Boolean))].sort(),
    [entries]
  );
  const classrooms = useMemo(
    () => [...new Set(entries.map((e) => e.classroom).filter(Boolean))].sort(),
    [entries]
  );

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (departmentFilter === "All" || e.department === departmentFilter) &&
          (facultyFilter === "All" || e.faculty === facultyFilter) &&
          (classroomFilter === "All" || e.classroom === classroomFilter) &&
          (dayFilter === "All" || e.day === dayFilter)
      ),
    [entries, departmentFilter, facultyFilter, classroomFilter, dayFilter]
  );

  const conflicts = useMemo(
    () =>
      filtered.filter((entry) => getConflict(entry, entries)),
    [filtered, entries]
  );

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNotice("");
    setModalOpen(true);
  }

  function openEdit(entry: TimetableEntry) {
    setEditingId(entry._id);
    setForm({
      day: entry.day,
      subject: entry.subject,
      faculty: entry.faculty,
      classroom: entry.classroom,
      department: entry.department,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    setNotice("");
    setModalOpen(true);
  }

  async function saveEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    if (form.startTime >= form.endTime) {
      setError("End time must be later than start time.");
      setSaving(false);
      return;
    }

    const proposed = {
      ...form,
      _id: editingId ?? "new-entry",
    } as TimetableEntry;

    const conflict = getConflict(proposed, entries);
    if (conflict) {
      const reason =
        conflict.faculty.trim().toLowerCase() === form.faculty.trim().toLowerCase()
          ? "This faculty member already has a class in this time slot."
          : "This classroom is already assigned in this time slot.";
      setError(reason + " Please change the faculty, room, or time.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Could not save timetable entry (${response.status}). ${message}`
        );
      }

      setModalOpen(false);
      setNotice(editingId ? "Timetable entry updated." : "Timetable entry created.");
      await loadTimetable();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Network error while saving. Check that the timetable API is available."
          : err instanceof Error
            ? err.message
            : "Could not save timetable entry."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm("Delete this timetable entry?")) return;

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Could not delete entry (${response.status}).`);
      }
      setNotice("Timetable entry deleted.");
      await loadTimetable();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Network error while deleting. Check the backend connection."
          : err instanceof Error
            ? err.message
            : "Could not delete entry."
      );
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">
          ← Back to Dashboard
        </Link>

        <header className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-cyan-400">ACADEMIC RESOURCE MANAGEMENT</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Timetable Management</h1>
            <p className="mt-3 text-slate-400">
              Manage weekly classes, faculty assignments, rooms, and scheduling conflicts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadTimetable()}
              disabled={loading}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button
              onClick={openAdd}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              + Add Class
            </button>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Total Classes", entries.length],
            ["Days Scheduled", new Set(entries.map((e) => e.day)).size],
            ["Faculty Conflicts", conflicts.length],
            ["Departments", departments.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-200">
            <strong>Problem:</strong> {error}
            {error.includes("not implemented") && (
              <p className="mt-2 text-rose-100">
                The current backend must implement GET, POST, PUT /:id and DELETE /:id
                routes at /api/timetable, plus a Timetable model.
              </p>
            )}
          </div>
        )}
        {notice && (
          <p role="status" className="mt-5 rounded-xl border border-emerald-800 bg-emerald-950/30 p-4 text-sm text-emerald-200">
            {notice}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Filter timetable</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Department",
                value: departmentFilter,
                set: setDepartmentFilter,
                options: departments,
              },
              {
                label: "Faculty",
                value: facultyFilter,
                set: setFacultyFilter,
                options: faculties,
              },
              {
                label: "Classroom",
                value: classroomFilter,
                set: setClassroomFilter,
                options: classrooms,
              },
              {
                label: "Day",
                value: dayFilter,
                set: setDayFilter,
                options: DAYS,
              },
            ].map((filter) => (
              <label key={filter.label} className="text-sm text-slate-400">
                {filter.label}
                <select
                  className={`${inputClass} mt-2`}
                  value={filter.value}
                  onChange={(e) => filter.set(e.target.value)}
                >
                  <option value="All">All {filter.label.toLowerCase()}s</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        {conflicts.length > 0 && (
          <div className="mt-5 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">
            ⚠️ {conflicts.length} visible timetable entr{conflicts.length === 1 ? "y has" : "ies have"} overlapping faculty or classroom assignments.
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold">Weekly Timetable</h2>
          <p className="mt-1 text-sm text-slate-400">Monday to Saturday · Entries are shown by day and time.</p>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Loading timetable...
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <p className="text-lg font-semibold">No timetable entries found</p>
              <p className="mt-2 text-sm text-slate-400">
                Add a class or change your filters. If the API is not implemented, backend work is required before records can load.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {DAYS.filter((day) => dayFilter === "All" || day === dayFilter).map((day) => {
                const dayEntries = filtered
                  .filter((entry) => entry.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                if (!dayEntries.length) return null;

                return (
                  <div key={day} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    <div className="border-b border-slate-800 bg-slate-900/80 px-5 py-4">
                      <h3 className="font-semibold text-cyan-300">{day}</h3>
                    </div>
                    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                      {dayEntries.map((entry) => {
                        const conflict = getConflict(entry, entries);
                        return (
                          <article key={entry._id} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{entry.subject}</p>
                                <p className="mt-1 text-sm text-cyan-300">
                                  {entry.startTime} – {entry.endTime}
                                </p>
                              </div>
                              {conflict && (
                                <span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs text-amber-300">
                                  Conflict
                                </span>
                              )}
                            </div>
                            <dl className="mt-4 space-y-2 text-sm">
                              <div><dt className="inline text-slate-500">Faculty: </dt><dd className="inline">{entry.faculty}</dd></div>
                              <div><dt className="inline text-slate-500">Classroom: </dt><dd className="inline">{entry.classroom}</dd></div>
                              <div><dt className="inline text-slate-500">Department: </dt><dd className="inline">{entry.department}</dd></div>
                            </dl>
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => openEdit(entry)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => void deleteEntry(entry._id)}
                                className="rounded-lg border border-rose-800 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950"
                              >
                                Delete
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="timetable-form-title"
              className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 id="timetable-form-title" className="text-xl font-bold">
                  {editingId ? "Edit Timetable Entry" : "Add Timetable Entry"}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-2xl text-slate-400 hover:text-white" aria-label="Close">
                  ×
                </button>
              </div>

              <form onSubmit={saveEntry} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Day
                    <select className={`${inputClass} mt-2`} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                      {DAYS.map((day) => <option key={day}>{day}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-300">
                    Subject
                    <input required maxLength={100} className={`${inputClass} mt-2`} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Machine Learning" />
                  </label>
                  <label className="text-sm text-slate-300">
                    Faculty
                    <input required maxLength={100} className={`${inputClass} mt-2`} value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} placeholder="Faculty name" />
                  </label>
                  <label className="text-sm text-slate-300">
                    Classroom
                    <input required maxLength={50} className={`${inputClass} mt-2`} value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} placeholder="e.g. CR-1" />
                  </label>
                  <label className="text-sm text-slate-300">
                    Department
                    <input required maxLength={100} className={`${inputClass} mt-2`} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" />
                  </label>
                  <label className="text-sm text-slate-300">
                    Start time
                    <input required type="time" className={`${inputClass} mt-2`} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </label>
                  <label className="text-sm text-slate-300 sm:col-span-2">
                    End time
                    <input required type="time" className={`${inputClass} mt-2`} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </label>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-700 px-4 py-3 hover:bg-slate-800">
                    Cancel
                  </button>
                  <button disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Entry"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
