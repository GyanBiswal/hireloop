// app/dashboard/page.js
//
// Dashboard home — the first page users see after logging in.
// This is a SERVER Component (no 'use client') so it can:
// 1. Call getServerSession() to read the session from the request cookie
// 2. Run Prisma queries directly (in Phase 5 we'll add real counts)
//
// Server Components run on the server only — never sent to the browser as JS.
// This means the session check happens server-side before any HTML is sent.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

// Role → badge color mapping (same as Navbar — could be extracted to a shared lib later)
// Upgraded to vibrant neon pastels optimized with higher contrast contrast rules for dark mode backgrounds
const ROLE_COLORS = {
  ADMIN:       'bg-rose-500/10 text-rose-400 border-rose-500/30',
  RECRUITER:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  INTERVIEWER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
}

// Hardcoded stat cards for now — Phase 5 will replace these with real DB counts
const STATS = [
  { label: 'Active Jobs',       value: '—', description: 'Currently open positions'      },
  { label: 'Total Candidates',  value: '—', description: 'Across all jobs'               },
  { label: 'Pending Reviews',   value: '—', description: 'Scorecards awaiting submission' },
]

export default async function DashboardPage() {
  // getServerSession reads the JWT cookie from the incoming HTTP request
  // and decodes it using our authOptions (same callbacks that built the token)
  const session = await getServerSession(authOptions)

  // Double-check: middleware should have already redirected unauthenticated users,
  // but this is a safety net in case middleware is misconfigured.
  if (!session) redirect('/login')

  const { name, role } = session.user

  return (
    <div className="min-h-screen bg-black text-slate-100 antialiased px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Welcome header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back, {name} <span className="animate-bounce inline-block">👋</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Here is what is happening across your hiring pipelines today.</p>
          </div>
          
          {/* Role badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Account Role:</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ROLE_COLORS[role]}`}>
              {role}
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-800 p-6 shadow-sm hover:border-slate-700/80 transition-all duration-200"
            >
              {/* Large number */}
              <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
              {/* Stat name */}
              <div className="text-sm font-semibold text-slate-200">{stat.label}</div>
              {/* Description */}
              <div className="text-xs text-slate-400 mt-1">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Database Setup Notice Box */}
        <div className="mt-12 rounded-xl bg-slate-900/40 border border-slate-800 p-8 text-center max-w-2xl mx-auto">
          <h3 className="text-sm font-semibold text-slate-200">Awaiting Database Phase Hook</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Your core architecture is verified. Live database counts will replace these placeholders automatically as soon as your Phase 5 Prisma calculations go live.
          </p>
        </div>

      </div>
    </div>
  )
}