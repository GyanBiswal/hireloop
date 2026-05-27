import Link from 'next/link'

// 1. Feature data explicitly mirrors your NextAuth roles & Prisma architecture
const FEATURES = [
  {
    title: 'Custom Pipeline Transactions',
    description:
      'Initialize jobs with custom pipeline structures instantly. Powered by an atomic database engine that ensures zero data corruption.',
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Conflict-Free Scorecards',
    description:
      'Collect real-time feedback with automatic business logic gates that block self-referrals and keep scoring tracks secure.',
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    title: 'JWT Token Gatekeeping',
    description:
      'Rigid middleware routing out of the box. Recruiters build roles, interviewers score tracks, and admins audit telemetry data.',
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

// 2. Reflects the 5 exact stages generated in your Prisma transactions
const DEMO_PIPELINE = [
  { stage: 'Applied', count: 42, active: false, color: 'slate' },
  { stage: 'Screening', count: 18, active: false, color: 'slate' },
  {
    stage: 'Interview',
    count: 5,
    active: true,
    color: 'indigo',
    candidate: { name: 'Sarah Jenkins', role: 'Sr. Product Designer', status: 'Scorecard Pending' },
  },
  { stage: 'Offer', count: 2, active: false, color: 'slate' },
  { stage: 'Hired', count: 11, active: false, color: 'emerald' },
]

// 3. Represents aggregate tracking values pulled from your GET /api/analytics/funnel database engine
const STATS = [
  { value: '14.2d', label: 'Avg Funnel Velocity' },
  { value: '87.4%', label: 'Aggregate Conversion Rate' },
  { value: '0ms', label: 'Middleware Guard Overhead' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">

      {/* Grid Mesh Layout Accent */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

      {/* Atmospheric Focus Element */}
      <div className="pointer-events-none fixed top-[-15%] left-1/2 -translate-x-1/2 -z-10 h-[520px] w-[900px] rounded-full bg-indigo-500/10 blur-[120px]" />

      {/* ── Navbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-black/75 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-black text-white shadow-sm">H</span>
            Hire<span className="-ml-[1px] text-indigo-400">Loop</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-xs font-semibold text-slate-400 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-14 pt-24 text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
          Role-Driven Recruitment Engine
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
          Dynamic pipeline tracking for{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
            high-throughput teams
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400">
          Provision structured transactional workflows. Intercept access via rigid context authentication, evaluate profiles smoothly, and eliminate tracking spreadsheets.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="w-full rounded-xl bg-indigo-600 px-8 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 sm:w-auto"
          >
            Start Recruiting Free
          </Link>
          <Link
            href="/demo"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 px-8 py-3 text-xs font-bold shadow-sm transition hover:bg-slate-900/80 sm:w-auto"
          >
            Request API Demo
          </Link>
        </div>
      </section>

      {/* ── Live Kanban Window & Funnel Aggregates ─────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-2xl shadow-black">

          {/* Frame Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
              </div>
              <span className="text-[11px] font-medium text-slate-500">pipeline_view.dashboard</span>
            </div>
            
            {/* Visual indicator highlighting your backend audit logger */}
            <div className="flex items-center gap-1.5 rounded border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1">
              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-indigo-400 tracking-wide uppercase">Audit Engine Online</span>
            </div>
          </div>

          {/* Pipeline Active Meta */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-semibold text-slate-200">Senior Product Designer Pipeline</p>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Active Job Row
              </span>
            </div>
            <p className="text-xs text-slate-500">Prisma State Matrix Sync: Verified</p>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-5">
            {DEMO_PIPELINE.map((p) => (
              <div
                key={p.stage}
                className={`rounded-xl border p-3 transition-all duration-200 ${
                  p.active
                    ? 'border-indigo-500/40 bg-indigo-500/5 ring-1 ring-indigo-500/20'
                    : p.color === 'emerald'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-900/20'
                }`}
              >
                {/* Column header displaying the actual stages */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      p.active ? 'text-indigo-400' : p.color === 'emerald' ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {p.stage}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      p.active
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : p.color === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.count}
                  </span>
                </div>

                {/* Candidate Content Box */}
                {p.active ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-md">
                    <p className="text-[11px] font-semibold text-white">{p.candidate.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{p.candidate.role}</p>
                    
                    {/* Visual state representing Step 6 (Pre-Scorecard execution state) */}
                    <div className="mt-3 flex items-center gap-1.5 border-t border-slate-900 pt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                        {p.candidate.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-slate-800">
                    <span className="text-[10px] text-slate-600">Drop Target</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Database Analytics Row representing aggregate query metrics */}
          <div className="grid grid-cols-3 divide-x divide-slate-800 border-t border-slate-800 bg-slate-950/20">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center py-4">
                <span className="text-xl font-bold tracking-tight text-white">{s.value}</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core System Infrastructure Features ────────── */}
      <section className="mx-auto max-w-7xl border-t border-slate-900 px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Clean architectural integrity out of the box
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
            A production-ready recruiting portal explicitly optimized for role-based security isolation and low-latency rendering loops.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-sm transition-all duration-200 hover:border-slate-700"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 transition-colors duration-200 group-hover:bg-slate-800">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-slate-900 bg-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-7 text-xs font-medium text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">HireLoop</span>
            <span className="text-slate-800">·</span>
            <span>Prisma + NextAuth Platform</span>
          </div>
          <div>© {new Date().getFullYear()} HireLoop. All rights reserved.</div>
        </div>
      </footer>

    </div>
  )
}