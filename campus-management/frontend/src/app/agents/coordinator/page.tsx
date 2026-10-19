
"use client";

import { useState } from "react";

type AgentStatus = "idle" | "running" | "completed";

type AgentResult = {
  name: string;
  role: string;
  icon: string;
  status: AgentStatus;
  result: string;
};

const initialAgents: AgentResult[] = [
  {
    name: "Faculty Agent",
    role: "Faculty availability and assignment",
    icon: "👩‍🏫",
    status: "idle",
    result: "Waiting for coordination",
  },
  {
    name: "Classroom Agent",
    role: "Room availability and capacity",
    icon: "🏫",
    status: "idle",
    result: "Waiting for coordination",
  },
  {
    name: "Timetable Agent",
    role: "Schedule and time conflict analysis",
    icon: "📅",
    status: "idle",
    result: "Waiting for coordination",
  },
  {
    name: "RL Scheduling Agent",
    role: "Candidate schedule evaluation",
    icon: "🧠",
    status: "idle",
    result: "Waiting for coordination",
  },
];

export default function CoordinatorPage() {
  const [semester, setSemester] = useState("5");
  const [batch, setBatch] = useState("Batch A");
  const [department, setDepartment] = useState("Machine Learning");
  const [agents, setAgents] = useState(initialAgents);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState("");

  async function coordinateAgents() {
    setRunning(true);
    setSummary("");

    setAgents(
      initialAgents.map((agent) => ({
        ...agent,
        status: "running",
        result: "Analyzing request...",
      }))
    );

    try {
      const response = await fetch(
        `http://localhost:5000/api/timetable?semester=${semester}`
      );

      if (!response.ok) {
        throw new Error("Timetable API request failed");
      }

      const data = await response.json();

      const entries = Array.isArray(data)
        ? data
        : data.data || data.timetables || [];

      const batchEntries = entries.filter(
        (entry: { batch?: string }) => entry.batch === batch
      );

      let conflicts = 0;

      for (let i = 0; i < batchEntries.length; i++) {
        for (let j = i + 1; j < batchEntries.length; j++) {
          const a = batchEntries[i];
          const b = batchEntries[j];

          if (
            a.day !== b.day ||
            !a.startTime ||
            !a.endTime ||
            !b.startTime ||
            !b.endTime ||
            a.startTime >= b.endTime ||
            b.startTime >= a.endTime
          ) {
            continue;
          }

          const facultyA =
            typeof a.faculty === "object"
              ? a.faculty?.name
              : a.faculty;

          const facultyB =
            typeof b.faculty === "object"
              ? b.faculty?.name
              : b.faculty;

          const roomA =
            typeof a.classroom === "object"
              ? a.classroom?.name || a.classroom?.roomNumber
              : a.classroom;

          const roomB =
            typeof b.classroom === "object"
              ? b.classroom?.name || b.classroom?.roomNumber
              : b.classroom;

          if (
            (facultyA && facultyA === facultyB) ||
            (roomA && roomA === roomB)
          ) {
            conflicts++;
          }
        }
      }

      const results: AgentResult[] = [
        {
          ...initialAgents[0],
          status: "completed",
          result: "Faculty conflict checks completed using timetable assignments.",
        },
        {
          ...initialAgents[1],
          status: "completed",
          result: "Classroom assignment checks completed using timetable data.",
        },
        {
          ...initialAgents[2],
          status: "completed",
          result: `${conflicts} possible faculty/classroom conflict(s) detected.`,
        },
        {
          ...initialAgents[3],
          status: "completed",
          result:
            batchEntries.length > 0
              ? `${batchEntries.length} timetable entries are ready for schedule evaluation.`
              : "No matching batch entries. Add timetable data before evaluation.",
        },
      ];

      setAgents(results);

      setSummary(
        batchEntries.length === 0
          ? `No timetable entries found for ${department}, Semester ${semester}, ${batch}. Check the batch field in your database.`
          : `Coordination completed for ${department}, Semester ${semester}, ${batch}. Found ${batchEntries.length} entries and ${conflicts} possible conflicts.`
      );
    } catch {
      setAgents(
        initialAgents.map((agent) => ({
          ...agent,
          status: "idle",
          result: "Unable to complete this check",
        }))
      );

      setSummary(
        "Backend connect aagala da. Backend server localhost:5000-la running-ah irukka-nu check pannu."
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            CampusAI · Multi-Agent Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Agentic AI Coordinator
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            Coordinate campus scheduling checks across specialized agents
            and summarize the results in one place.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric title="Department" value="ML" />
          <Metric title="Active Batches" value="2" />
          <Metric title="Students / Batch" value="50" />
          <Metric title="Coordinated Agents" value="4" />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Coordination Request</h2>

          <p className="mt-2 text-sm text-slate-400">
            Select the academic context and ask the coordinator to inspect
            the timetable data.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Field label="Department">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="field"
              >
                <option value="Machine Learning">Machine Learning</option>
              </select>
            </Field>

            <Field label="Semester">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="field"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Batch">
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="field"
              >
                <option value="Batch A">Batch A — 50 students</option>
                <option value="Batch B">Batch B — 50 students</option>
              </select>
            </Field>
          </div>

          <button
            onClick={coordinateAgents}
            disabled={running}
            className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {running ? "Coordinating Agents..." : "Run Coordination"}
          </button>
        </section>

        <section>
          <h2 className="text-xl font-bold">Agent Status</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <article
                key={agent.name}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                    {agent.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold">{agent.name}</h3>
                      <Status status={agent.status} />
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {agent.role}
                    </p>

                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      {agent.result}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {summary && (
          <section className="rounded-2xl border border-cyan-900 bg-cyan-950/30 p-6">
            <h2 className="font-bold text-cyan-300">
              Coordination Summary
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {summary}
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-bold">How Coordination Works</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Info
              title="1. Collect"
              text="Receive semester, batch and existing timetable entries."
            />
            <Info
              title="2. Analyze"
              text="Run faculty, classroom and schedule checks on the loaded data."
            />
            <Info
              title="3. Recommend"
              text="Summarize findings and identify missing data or possible conflicts."
            />
          </div>
        </section>

        <p className="text-center text-xs text-slate-500">
          CampusAI · Coordinator prototype · Rule-based checks, not an
          autonomous trained multi-agent model yet.
        </p>
      </div>

      <style jsx>{`
        .field {
          margin-top: 8px;
          width: 100%;
          border: 1px solid rgb(51 65 85);
          border-radius: 8px;
          background: rgb(2 6 23);
          padding: 12px;
          color: white;
          outline: none;
        }

        .field:focus {
          border-color: rgb(34 211 238);
        }
      `}</style>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      {children}
    </label>
  );
}

function Status({ status }: { status: AgentStatus }) {
  const style = {
    idle: "bg-slate-800 text-slate-300",
    running: "bg-amber-950 text-amber-300",
    completed: "bg-emerald-950 text-emerald-300",
  }[status];

  const label = {
    idle: "Idle",
    running: "Running",
    completed: "Checked",
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h3 className="font-semibold text-cyan-300">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
