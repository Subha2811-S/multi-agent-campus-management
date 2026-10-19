
"use client";

import { useCallback, useEffect, useState } from "react";

type PersonOrRoom =
  | string
  | {
      name?: string;
      roomNumber?: string;
    }
  | null
  | undefined;

type TimetableEntry = {
  _id?: string;
  day?: string;
  subject?: string;
  subjectCode?: string;
  startTime?: string;
  endTime?: string;
  semester?: number;
  batch?: string;
  department?: string;
  faculty?: PersonOrRoom;
  classroom?: PersonOrRoom;
};

type Classroom = {
  _id?: string;
  name?: string;
  roomNumber?: string;
  capacity?: number;
  type?: string;
};

type OptimizationResult = {
  success: boolean;
  algorithm?: string;
  episodes?: number;
  entriesProcessed: number;
  assignedEntries: number;
  unassignedEntries: number;
  reward: number;
  conflicts: number;
  schedule: TimetableEntry[];
  message?: string;
  savedToDatabase: boolean;
};

const API = "http://localhost:5000/api";

function getName(value: PersonOrRoom): string {
  if (!value) return "Not assigned";
  if (typeof value === "string") return value;
  return value.name || value.roomNumber || "Assigned";
}

function getList<T>(
  value: unknown,
  keys: string[] = []
): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}


const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function timeToMinutes(time?: string) {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function formatTime(time?: string) {
  if (!time) return "--";

  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes || 0).padStart(2, "0")} ${suffix}`;
}


export default function RLSchedulingPage() {
  const [semester, setSemester] = useState("5");
  const [batch, setBatch] = useState("");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [optimization, setOptimization] =
    useState<OptimizationResult | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setOptimization(null);

    try {
      const [timetableResponse, classroomResponse] =
        await Promise.all([
          fetch(`${API}/timetable?semester=${semester}`),
          fetch(`${API}/classrooms`),
        ]);

      if (!timetableResponse.ok) {
        throw new Error(
          `Timetable API failed (${timetableResponse.status}). Check backend.`
        );
      }

      const timetableData: unknown =
        await timetableResponse.json();

      const classroomData: unknown = classroomResponse.ok
        ? await classroomResponse.json()
        : [];

      const timetableList = getList<TimetableEntry>(
        timetableData,
        ["data", "timetables", "entries"]
      );

      const classroomList = getList<Classroom>(
        classroomData,
        ["data", "classrooms", "rooms"]
      );

      setTimetable(timetableList);
      setClassrooms(classroomList);

      const actualBatches = Array.from(
        new Set(
          timetableList
            .map((entry) => entry.batch)
            .filter((value): value is string => Boolean(value))
        )
      );

      setBatch((currentBatch) =>
        actualBatches.includes(currentBatch)
          ? currentBatch
          : actualBatches[0] ?? ""
      );
    } catch (err) {
      setTimetable([]);
      setClassrooms([]);
      setBatch("");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load campus data."
      );
    } finally {
      setLoading(false);
    }
  }, [semester]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const batchEntries = timetable.filter(
    (entry) => entry.batch === batch
  );

  const displayedEntries =
    optimization?.schedule ?? batchEntries;

  const runOptimization = async () => {
    if (!batch) {
      setError(
        "No batch found for this semester. Check your timetable data."
      );
      return;
    }

    setEvaluating(true);
    setError("");
    setOptimization(null);

    try {
      const response = await fetch(`${API}/rl/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentCount: 50,
          semester: Number(semester),
          batch,
          department: "CSE (AI & ML)",
        }),
      });

      const result =
        (await response.json()) as OptimizationResult;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `RL optimization failed (${response.status}).`
        );
      }

      setOptimization(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the RL optimization API."
      );
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            CampusAI · Intelligent Scheduling
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            RL Scheduling Agent
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Evaluate timetable quality, inspect scheduling
            conflicts and generate a proposed schedule using
            the reinforcement-learning prototype.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            title="Selected Batch"
            value={batch || "Not selected"}
            detail="Loaded from timetable data"
          />

          <Metric
            title="Students"
            value="50"
            detail="Configured batch size"
          />

          <Metric
            title="Timetable Entries"
            value={String(batchEntries.length)}
            detail={`Semester ${semester} · Selected batch`}
          />

          <Metric
            title="Available Classrooms"
            value={String(classrooms.length)}
            detail="From classroom API"
          />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">
            Scheduling Environment
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Select a semester and a batch available in your
            existing timetable.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <label className="block text-sm text-slate-300">
              Semester

              <select
                value={semester}
                onChange={(event) =>
                  setSemester(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                {Array.from(
                  { length: 8 },
                  (_, index) => index + 1
                ).map((value) => (
                  <option
                    key={value}
                    value={String(value)}
                  >
                    Semester {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-300">
  Student Batch

  <select
    value={batch}
    onChange={(event) => setBatch(event.target.value)}
    disabled={loading || evaluating || timetable.length === 0}
    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-50"
  >
    {Array.from(
      new Set(
        timetable
          .map((entry) => entry.batch)
          .filter(
            (value): value is string => Boolean(value)
          )
      )
    ).map((batchName) => (
      <option key={batchName} value={batchName}>
        {batchName}
      </option>
    ))}
  </select>
</label>

            <div className="flex items-end">
              <button
                onClick={() => void loadData()}
                disabled={loading || evaluating}
                className="w-full rounded-lg border border-slate-700 px-4 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh Data"}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300"
            >
              {error}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-cyan-900 bg-gradient-to-br from-cyan-950/60 to-slate-900 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-cyan-300">
                RL AGENT
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Optimize Timetable
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Generate a proposed schedule and inspect the
                engine-reported reward, assignments and
                conflicts. Existing database records are not
                changed by this endpoint.
              </p>
            </div>

            <button
              onClick={() => void runOptimization()}
              disabled={
                loading || evaluating || !batch
              }
              className="shrink-0 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {evaluating
                ? "Optimizing..."
                : "Optimize Timetable"}
            </button>
          </div>

          {optimization && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  title="Entries Processed"
                  value={String(
                    optimization.entriesProcessed
                  )}
                  detail="Processed by the RL engine"
                />

                <Metric
                  title="Assigned Entries"
                  value={String(
                    optimization.assignedEntries
                  )}
                  detail={`${optimization.unassignedEntries} unassigned`}
                />

                <Metric
                  title="Reported Conflicts"
                  value={String(optimization.conflicts)}
                  detail="Engine-reported count"
                />

                <Metric
                  title="Reward"
                  value={String(optimization.reward)}
                  detail={
                    optimization.episodes != null
                      ? `${optimization.episodes} episodes`
                      : optimization.algorithm ??
                        "Engine result"
                  }
                />
              </div>

              <p className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
                {optimization.message ||
                  "Optimization completed."}
              </p>

              <p className="text-sm text-amber-300">
                {optimization.savedToDatabase
                  ? "The API reports that the schedule was saved."
                  : "Proposed schedule only — database was not changed."}
              </p>

              {optimization.algorithm && (
                <p className="text-xs text-slate-400">
                  Algorithm: {optimization.algorithm}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
                {optimization
                  ? "Proposed Schedule"
                  : "Current Schedule"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Semester {semester} · {batch || "No batch"}
              </p>
            </div>

            <span className="text-sm text-slate-400">
              {displayedEntries.length} entries
            </span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-400">
              Loading timetable...
            </p>
          ) : displayedEntries.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="font-semibold">
                No timetable entries found
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Check the semester, batch values and
                timetable API response.
              </p>
            </div>
          ) : (
            
<div className="mt-5 overflow-x-auto">
  {(() => {
    const days = DAY_ORDER.filter((day) =>
      displayedEntries.some(
        (entry) =>
          entry.day?.toLowerCase() === day.toLowerCase()
      )
    );

    const timeSlots = Array.from(
      new Map(
        displayedEntries.map((entry) => {
          const key = `${entry.startTime || ""}-${entry.endTime || ""}`;

          return [
            key,
            {
              key,
              startTime: entry.startTime || "",
              endTime: entry.endTime || "",
            },
          ];
        })
      ).values()
    ).sort(
      (a, b) =>
        timeToMinutes(a.startTime) -
        timeToMinutes(b.startTime)
    );

    return (
      <table className="w-full min-w-[1000px] border-collapse text-center text-xs">
        <thead>
          <tr className="bg-slate-800 text-cyan-300">
            <th className="sticky left-0 z-10 border border-slate-700 p-3">
              Day
            </th>

            {timeSlots.map((slot) => (
              <th
                key={slot.key}
                className="min-w-[170px] border border-slate-700 p-3"
              >
                {formatTime(slot.startTime)}
                <span className="block py-1 text-slate-400">
                  to
                </span>
                {formatTime(slot.endTime)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {days.map((day) => (
            <tr key={day} className="bg-slate-900">
              <th className="sticky left-0 z-10 border border-slate-700 bg-slate-800 p-4 font-bold text-white">
                {day}
              </th>

              {timeSlots.map((slot) => {
                const classes = displayedEntries.filter(
                  (entry) =>
                    entry.day?.toLowerCase() ===
                      day.toLowerCase() &&
                    (entry.startTime || "") ===
                      slot.startTime &&
                    (entry.endTime || "") ===
                      slot.endTime
                );

                return (
                  <td
                    key={`${day}-${slot.key}`}
                    className="border border-slate-700 p-2 align-top"
                  >
                    {classes.length > 0 ? (
                      <div className="space-y-2">
                        {classes.map((entry, index) => (
                          <div
                            key={entry._id || `${day}-${slot.key}-${index}`}
                            className="rounded-lg border border-cyan-800 bg-cyan-950/50 p-3 text-left"
                          >
                            <p className="font-bold leading-5 text-cyan-200">
                              {entry.subject ||
                                entry.subjectCode ||
                                "Subject not specified"}
                            </p>

                            {entry.subjectCode && (
                              <p className="mt-1 text-slate-400">
                                {entry.subjectCode}
                              </p>
                            )}

                            <p className="mt-2 text-slate-200">
                              {getName(entry.faculty)}
                            </p>

                            <p className="mt-1 text-slate-400">
                              Room: {getName(entry.classroom)}
                            </p>

                            <p className="mt-2 text-cyan-300">
                              {entry.batch || batch}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  })()}
</div>

          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="State"
            description="Semester, batch, faculty, classroom and timetable information."
          />

          <InfoCard
            title="Actions"
            description="The backend generates a proposed schedule for inspection."
          />

          <InfoCard
            title="Reward"
            description="The engine reports its reward and conflict count. These values need validation and do not prove optimality."
          />
        </section>

        <p className="text-center text-xs text-slate-500">
          CampusAI · RL scheduling prototype · Review and
          validate proposed schedules before applying changes.
        </p>
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 break-words text-2xl font-bold text-white">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="font-bold text-cyan-300">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}
