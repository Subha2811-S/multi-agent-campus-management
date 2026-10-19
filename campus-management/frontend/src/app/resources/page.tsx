
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

type Classroom = {
  _id?: string;
  id?: string;
  name?: string;
  roomName?: string;
  roomNumber?: string;
  code?: string;
  capacity?: number;
  seatingCapacity?: number;
  type?: string;
  roomType?: string;
  department?: string;
  facilities?: string[];
  equipment?: string[];
  isAvailable?: boolean;
  status?: string;
};

type TimetableEntry = {
  classroom?: string | {
    _id?: string;
    name?: string;
    roomNumber?: string;
  };
  day?: string;
  startTime?: string;
  endTime?: string;
};

function unwrap<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const object = data as Record<string, unknown>;
    for (const key of ["data", "classrooms", "rooms", "timetables"]) {
      if (Array.isArray(object[key])) return object[key] as T[];
    }
  }

  return [];
}

function roomName(room: Classroom) {
  return (
    room.name ||
    room.roomName ||
    room.roomNumber ||
    room.code ||
    "Unnamed room"
  );
}

function roomCapacity(room: Classroom) {
  return Number(room.capacity ?? room.seatingCapacity ?? 0);
}

function roomType(room: Classroom) {
  return room.type || room.roomType || "Unspecified";
}

function allocatedRoom(entry: TimetableEntry) {
  if (!entry.classroom) return "";

  if (typeof entry.classroom === "string") {
    return entry.classroom;
  }

  return (
    entry.classroom._id ||
    entry.classroom.name ||
    entry.classroom.roomNumber ||
    ""
  );
}

function isSameRoom(room: Classroom, entry: TimetableEntry) {
  const assigned = allocatedRoom(entry);
  if (!assigned) return false;

  return [
    room._id,
    room.id,
    room.name,
    room.roomName,
    room.roomNumber,
    room.code,
  ]
    .filter(Boolean)
    .some((value) => String(value) === String(assigned));
}

export default function ResourcesPage() {
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [roomsResponse, timetableResponse] = await Promise.all([
        fetch(`${API}/classrooms`),
        fetch(`${API}/timetable`),
      ]);

      if (!roomsResponse.ok) {
        throw new Error("Classroom API load aagala. Backend check pannu da.");
      }

      const roomData = await roomsResponse.json();
      const scheduleData = timetableResponse.ok
        ? await timetableResponse.json()
        : [];

      setRooms(unwrap<Classroom>(roomData));
      setTimetable(unwrap<TimetableEntry>(scheduleData));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Resource data load panna mudiyala."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const types = useMemo(
    () => [
      "All",
      ...Array.from(new Set(rooms.map(roomType))).sort(),
    ],
    [rooms]
  );

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesType =
        typeFilter === "All" || roomType(room) === typeFilter;

      const searchable = [
        roomName(room),
        roomType(room),
        room.department || "",
        ...(room.facilities || []),
        ...(room.equipment || []),
      ]
        .join(" ")
        .toLowerCase();

      return matchesType && searchable.includes(query);
    });
  }, [rooms, search, typeFilter]);

  const totalCapacity = rooms.reduce(
    (total, room) => total + roomCapacity(room),
    0
  );

  const labCount = rooms.filter((room) =>
    /lab|laboratory/i.test(roomType(room))
  ).length;

  const allocatedEntries = timetable.filter(
    (entry) => Boolean(allocatedRoom(entry))
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <a
              href="/"
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Dashboard
            </a>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              CampusAI · Resource Intelligence
            </p>

            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Resource Management
            </h1>

            <p className="mt-3 text-slate-400">
              Monitor classrooms, laboratories, capacity and timetable
              resource allocations.
            </p>
          </div>

          <button
            onClick={() => void loadResources()}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-900 disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </header>

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon="🏫"
            label="Total Rooms"
            value={loading ? "..." : String(rooms.length)}
            detail="Rooms returned by classroom API"
          />
          <Metric
            icon="🧪"
            label="Laboratories"
            value={loading ? "..." : String(labCount)}
            detail="Based on room type"
          />
          <Metric
            icon="👥"
            label="Total Capacity"
            value={loading ? "..." : totalCapacity.toLocaleString()}
            detail="Combined configured room capacity"
          />
          <Metric
            icon="📅"
            label="Scheduled Entries"
            value={loading ? "..." : String(allocatedEntries)}
            detail="Timetable entries with a room assigned"
          />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Resource Inventory</h2>

          <p className="mt-2 text-sm text-slate-400">
            Search rooms by name, room type, department or facilities.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Search Resources
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search room, lab, equipment..."
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Resource Type
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Classrooms & Labs</h2>
            <span className="text-sm text-slate-400">
              {filteredRooms.length} resources
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
              Resource data load aagudhu da...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
              <p className="font-semibold">No resources found</p>
              <p className="mt-2 text-sm text-slate-400">
                Search filter change pannu, illa classroom data check pannu da.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room, index) => {
                const assignments = timetable.filter((entry) =>
                  isSameRoom(room, entry)
                );

                const capacity = roomCapacity(room);

                return (
                  <article
                    key={room._id || room.id || `${roomName(room)}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                        {/lab|laboratory/i.test(roomType(room))
                          ? "🧪"
                          : "🏫"}
                      </div>

                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-cyan-300">
                        {roomType(room)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold">
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {room.department || "Department not specified"}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-950 p-3">
                        <p className="text-xs text-slate-500">Capacity</p>
                        <p className="mt-1 font-semibold">
                          {capacity > 0 ? capacity : "Not set"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 p-3">
                        <p className="text-xs text-slate-500">
                          Timetable Entries
                        </p>
                        <p className="mt-1 font-semibold">
                          {assignments.length}
                        </p>
                      </div>
                    </div>

                    {(room.facilities?.length || room.equipment?.length) ? (
                      <div className="mt-4">
                        <p className="text-xs text-slate-500">
                          Facilities / Equipment
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[...(room.facilities || []), ...(room.equipment || [])]
                            .map(String)
                            .map((item, itemIndex) => (
                              <span
                                key={`${item}-${itemIndex}`}
                                className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300"
                              >
                                {item}
                              </span>
                            ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
                      {room.isAvailable === false ||
                      /unavailable|maintenance|occupied/i.test(
                        room.status || ""
                      )
                        ? "Marked unavailable in room data"
                        : room.status
                          ? `Recorded status: ${room.status}`
                          : "Availability not explicitly recorded"}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-cyan-900 bg-gradient-to-br from-cyan-950/50 to-slate-900 p-6">
          <p className="text-sm font-semibold text-cyan-300">
            INTELLIGENT RESOURCE ALLOCATION
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Ready for AI Scheduling
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Resource information can support the RL Scheduling Agent when
            selecting rooms. The next integration can evaluate room capacity,
            timetable conflicts and the needs of each student batch before
            recommending an allocation.
          </p>

          <p className="mt-4 text-xs text-slate-500">
            Current page displays API data. It does not yet automatically
            reserve rooms or calculate real-time free slots.
          </p>
        </section>

        <p className="text-center text-xs text-slate-600">
          CampusAI · Resource Management
        </p>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
