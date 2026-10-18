
"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/classrooms";

type Classroom = {
  _id: string;
  name: string;
  building: string;
  type: string;
  capacity: number;
  isAvailable: boolean;
};

const emptyForm = {
  name: "",
  building: "",
  type: "Classroom",
  capacity: "60",
  isAvailable: true,
};

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadClassrooms() {
    try {
      setError("");
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Unable to load classrooms");

      const data = await response.json();
      setClassrooms(Array.isArray(data) ? data : []);
    } catch {
      setError("Classroom data load aagala. Backend server check pannu da.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClassrooms();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            capacity: Number(form.capacity),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Save failed");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadClassrooms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(room: Classroom) {
    setEditingId(room._id);
    setForm({
      name: room.name,
      building: room.building,
      type: room.type,
      capacity: String(room.capacity),
      isAvailable: room.isAvailable,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Indha classroom-ah delete pannalama da?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Delete failed");

      await loadClassrooms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete failed"
      );
    }
  }

  const availableCount = classrooms.filter(
    (room) => room.isAvailable
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm text-cyan-400 hover:underline">
          ← Back to Dashboard
        </a>

        <header className="mt-5">
          <p className="text-sm font-semibold text-cyan-400">
            CAMPUS RESOURCE MANAGEMENT
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Classrooms & Labs
          </h1>
          <p className="mt-2 text-slate-400">
            Manage rooms, laboratories, capacity and availability.
          </p>
        </header>

        <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Rooms", value: classrooms.length },
            { label: "Available Rooms", value: availableCount },
            {
              label: "Total Capacity",
              value: classrooms.reduce((sum, room) => sum + room.capacity, 0),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-7 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Room" : "Add Classroom or Lab"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Room name (e.g. CS-101)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-cyan-500"
            />

            <input
              required
              placeholder="Building name"
              value={form.building}
              onChange={(e) => setForm({ ...form, building: e.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-cyan-500"
            />

            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-cyan-500"
            >
              <option>Classroom</option>
              <option>Computer Lab</option>
              <option>Science Lab</option>
              <option>Seminar Hall</option>
            </select>

            <input
              required
              type="number"
              min="1"
              placeholder="Capacity"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-cyan-500"
            />

            <label className="flex items-center gap-3 text-sm text-slate-300 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm({ ...form, isAvailable: e.target.checked })
                }
                className="h-4 w-4 accent-cyan-500"
              />
              Room currently available
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Room" : "Add Room"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {error && (
          <p className="mt-5 rounded-xl border border-red-800 bg-red-950 p-4 text-red-300">
            {error}
          </p>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Room Directory</h2>
            <button
              onClick={loadClassrooms}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-5 text-slate-400">Loading rooms...</p>
          ) : classrooms.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-3xl">🏫</p>
              <p className="mt-3 font-semibold">No rooms added yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Use the form above to add your first classroom or lab.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {classrooms.map((room) => (
                <article
                  key={room._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{room.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {room.building}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        room.isAvailable
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {room.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-cyan-300">{room.type}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Capacity: {room.capacity} people
                  </p>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => handleEdit(room)}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-300 hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
