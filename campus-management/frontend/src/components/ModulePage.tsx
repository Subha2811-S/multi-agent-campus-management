
import Link from "next/link";

type ModulePageProps = {
  title: string;
  description: string;
  icon?: string;
  features?: string[];
};

export default function ModulePage({
  title,
  description,
  icon = "🏫",
  features = ["Module setup in progress"],
}: ModulePageProps) {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm text-cyan-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-7 flex items-center gap-4">
          <span className="text-4xl">{icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-slate-400">{description}</p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">
            {title} Overview
          </h2>

          <ul className="mt-4 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="text-slate-300">
                <span className="mr-2 text-cyan-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
