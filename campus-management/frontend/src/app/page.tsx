
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/faculty";

const navigation = [
  { label: "Dashboard", href: "/", icon: "⌂" },
  { label: "Faculty", href: "/faculty", icon: "👩‍🏫" },
  { label: "Classrooms & Labs", href: "/classrooms", icon: "🏢" },
  { label: "Student Batches", href: "/batches", icon: "🎓" },
  { label: "Timetable", href: "/timetable", icon: "📅" },
  { label: "AI Agents", href: "/agents", icon: "🤖" },
  { label: "RL Scheduling Agent", href: "/agents/rl", icon: "🧠" },
  { label: "Resources", href: "/resources", icon: "📊" },
  { label: "Reports", href: "/reports", icon: "📈" },
];

const modules = [
  { title: "Faculty Management", description: "Manage faculty details and availability.", icon: "👩‍🏫", href: "/faculty" },
  { title: "Classroom Management", description: "Manage classrooms, labs and capacity.", icon: "🏢", href: "/classrooms" },
  { title: "Timetable Scheduling", description: "Generate and optimize academic schedules.", icon: "📅", href: "/timetable" },
  { title: "RL Scheduling Agent", description: "Learn better scheduling decisions using rewards.", icon: "🧠", href: "/agents/rl" },
  { title: "Agentic AI Coordinator", description: "Coordinate campus agents and rescheduling tasks.", icon: "🤖", href: "/agents" },
  { title: "Resource Management", description: "Monitor rooms and campus resources.", icon: "📊", href: "/resources" },
];

export default function Home() {
  const [facultyCount, setFacultyCount] = useState(0);

  useEffect(() => {
    const fetchFacultyCount = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch faculty");
        }

        const data = await response.json();

        const facultyList = Array.isArray(data)
          ? data
          : Array.isArray(data.faculty)
          ? data.faculty
          : Array.isArray(data.data)
          ? data.data
          : [];

        setFacultyCount(facultyList.length);
      } catch (error) {
        console.error("Faculty count fetch error:", error);
      }
    };

    fetchFacultyCount();
  }, []);

  const stats = [
    { label: "Total Faculty", value: String(facultyCount), icon: "👩‍🏫", href: "/faculty" },
    { label: "Classrooms & Labs", value: "0", icon: "🏫", href: "/classrooms" },
    { label: "Student Batches", value: "0", icon: "🎓", href: "/batches" },
    { label: "Schedule Conflicts", value: "—", icon: "⚠️", href: "/reports" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-800 bg-slate-900 p-6 lg:flex">
        <Link href="/" className="text-xl font-bold text-cyan-400">CampusAI</Link>
        <p className="mt-1 text-xs text-slate-400">Intelligent Campus Management</p>
        <nav className="mt-8 space-y-2 text-sm">
          {navigation.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-slate-300 transition hover:bg-cyan-500/15 hover:text-cyan-300"
            >
              <span className="mr-3">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-700 p-4">
          <p className="text-sm font-semibold">AI Scheduling</p>
          <p className="mt-2 text-xs text-slate-400">RL engine integration in progress</p>
          <span className="mt-3 inline-block rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">In development</span>
        </div>
      </aside>

      <section className="mx-auto max-w-7xl p-5 sm:p-8 lg:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-400">CAMPUS INTELLIGENCE PLATFORM</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Campus Dashboard</h1>
            <p className="mt-2 text-slate-400">Manage academic resources and intelligent scheduling.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Dashboard preview
          </div>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-700 hover:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="mt-4 text-sm text-slate-400">{stat.label}</p>
            </Link>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-cyan-900 bg-gradient-to-r from-cyan-950 to-slate-900 p-6 sm:p-8">
          <p className="text-sm font-semibold text-cyan-300">INTELLIGENT SCHEDULING</p>
          <h2 className="mt-3 text-2xl font-bold">Optimize. Coordinate. Adapt.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            The planned Reinforcement Learning engine will evaluate valid scheduling actions, while the Agentic AI coordinator will organize tasks across specialized campus agents.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {["Reinforcement Learning", "Multi-Agent AI", "Dynamic Rescheduling"].map((label) => (
              <span key={label} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">{label}</span>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Campus Modules</h2>
          <p className="mt-1 text-sm text-slate-400">Choose a module to open its page.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="block rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-cyan-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <span className="text-3xl">{module.icon}</span>
                <h3 className="mt-4 font-semibold">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
                <p className="mt-4 text-sm font-medium text-cyan-400">Open module →</p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          Multi-Agent AI Campus Management System · Initial UI Preview
        </footer>
      </section>
    </main>
  );
}
