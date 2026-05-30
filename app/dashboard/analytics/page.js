// app/dashboard/analytics/page.js
//
// ADMIN-only analytics page.
// Shows three sections:
//   1. Hiring funnel — how many candidates are in each pipeline stage across all jobs
//   2. Application status breakdown — ACTIVE vs HIRED vs REJECTED counts
//   3. Scorecard rating distribution — how many 1★ 2★ 3★ 4★ 5★ ratings were given
//
// All charts are pure Tailwind CSS bar charts — no chart library needed.
// WHY no library: Recharts or Chart.js would add ~200kb to the bundle for
// something we can render with a div and a percentage width. Simpler, faster,
// and easier to explain in interviews.
//
// All data is fetched in parallel with Promise.all for performance.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'

// Color classes for the job tracking rows
const JOB_STATUS_STYLES = {
  OPEN:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DRAFT:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CLOSED: 'bg-slate-800 text-slate-400 border-slate-700/60',
}

// Renders a single horizontal bar with a high-visibility translucent filling and solid cap edge
function Bar({ label, count, total, color }) {
  // Avoid division by zero — if total is 0, width is 0%
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="flex items-center gap-4 mb-4 last:mb-0">
      {/* Label — fixed width so bars all start at the same x position */}
      <span className="text-xs font-semibold text-slate-400 w-36 shrink-0 truncate">{label}</span>

      {/* Bar track — upgraded with a deeper charcoal fill for better bar contrast */}
      <div className="flex-1 bg-slate-950 border border-slate-900/60 rounded-lg h-6 overflow-hidden relative flex items-center shadow-inner">
        {/* Filled portion — bumped opacity to '33' (20%) and added an inner color overlay */}
        <div
          className="h-full rounded-l-md transition-all duration-500 ease-out flex items-center justify-end pr-2.5 relative"
          style={{ 
            width: `${pct}%`, 
            backgroundColor: `${color}33`, // Increased opacity from 1a to 33 for high-vibrancy contrast
            borderRight: `2px solid ${color}`,
            boxShadow: `inset -10px 0 20px -10px ${color}`, // Generates a clean subtle end-glow effect
            minWidth: pct > 0 ? '2.5rem' : '0' 
          }}
        >
          {pct > 12 && (
            <span className="text-[10px] font-mono font-bold tracking-wide" style={{ color: color }}>
              {pct}%
            </span>
          )}
        </div>
        {/* Absolute metric tag layer fallback for smaller bar thresholds */}
        {pct <= 12 && pct > 0 && (
          <span className="text-[10px] font-mono font-bold pl-2.5" style={{ color: color }}>
            {pct}%
          </span>
        )}
      </div>

      {/* Absolute count */}
      <span className="text-xs font-mono font-bold text-slate-500 w-8 text-right shrink-0">{count}</span>
    </div>
  )
}

// Stat summary card — reused in the header row
function SummaryCard({ label, value, sub }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800 p-5 shadow-sm">
      <div className="text-3xl font-black text-white tracking-tight">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1.5">{label}</div>
      {sub && <div className="text-[10px] font-medium text-slate-500 mt-0.5 leading-relaxed">{sub}</div>}
    </div>
  )
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Business rule #3: only ADMIN can view analytics
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  // ── Fetch all analytics data in parallel ────────────────────────────────────
  const [
    jobStats,
    applicationStatusCounts,
    ratingCounts,
    stageFunnelData,
    totalApplications,
    avgTimeToHire,
  ] = await Promise.all([

    // 1. Per-job stats: title + application counts by status
    prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:     true,
        title:  true,
        status: true,
        _count: { select: { applications: true } },
      },
    }),

    // 2. Application status breakdown — how many ACTIVE, HIRED, REJECTED
    // groupBy returns [{ status: 'ACTIVE', _count: { status: N } }, ...]
    prisma.application.groupBy({
      by:      ['status'],
      _count:  { status: true },
    }),

    // 3. Scorecard rating distribution — how many of each rating (1-5)
    prisma.scorecard.groupBy({
      by:      ['rating'],
      _count:  { rating: true },
      orderBy: { rating: 'asc' },
    }),

    // 4. Hiring funnel: count of applications per pipeline stage name
    //    We group by currentStageId then look up the stage name
    prisma.application.groupBy({
      by:      ['currentStageId'],
      _count:  { currentStageId: true },
      where:   { status: 'ACTIVE' }, // only ACTIVE applications are in the funnel
    }),

    // 5. Total application count (for percentages)
    prisma.application.count(),

    // 6. Average days from appliedAt to updatedAt for HIRED applications
    //    Prisma doesn't support AVG of date differences natively, so we fetch
    //    the raw dates and compute in JavaScript
    prisma.application.findMany({
      where:  { status: 'HIRED' },
      select: { appliedAt: true, updatedAt: true },
    }),
  ])

  // ── Compute derived values ──────────────────────────────────────────────────

  // Build a status count lookup: { ACTIVE: N, HIRED: N, REJECTED: N }
  const statusMap = {}
  for (const row of applicationStatusCounts) {
    statusMap[row.status] = row._count.status
  }

  // Build a rating count lookup: { 1: N, 2: N, 3: N, 4: N, 5: N }
  const ratingMap = {}
  for (const row of ratingCounts) {
    ratingMap[row.rating] = row._count.rating
  }
  const totalRatings = Object.values(ratingMap).reduce((a, b) => a + b, 0)

  // Fetch stage names for the funnel (we only have IDs from groupBy)
  const stageIds = stageFunnelData.map((r) => r.currentStageId)
  const stages = await prisma.pipelineStage.findMany({
    where: { id: { in: stageIds } },
    select: { id: true, name: true, color: true, order: true },
  })
  const stageById = {}
  for (const s of stages) stageById[s.id] = s

  // Build funnel rows sorted by stage order
  const funnelRows = stageFunnelData
    .map((row) => ({
      name:  stageById[row.currentStageId]?.name  ?? 'Unknown',
      color: stageById[row.currentStageId]?.color ?? '#818cf8',
      order: stageById[row.currentStageId]?.order ?? 99,
      count: row._count.currentStageId,
    }))
    .sort((a, b) => a.order - b.order)

  // Average time to hire in days
  let avgDays = null
  if (avgTimeToHire.length > 0) {
    const totalMs = avgTimeToHire.reduce((sum, app) => {
      return sum + (new Date(app.updatedAt) - new Date(app.appliedAt))
    }, 0)
    avgDays = Math.round(totalMs / avgTimeToHire.length / (1000 * 60 * 60 * 24))
  }

  const hiredCount   = statusMap['HIRED']    ?? 0
  const rejectedCount= statusMap['REJECTED'] ?? 0
  const activeCount  = statusMap['ACTIVE']   ?? 0

  return (
    <div className="min-h-screen bg-black text-slate-200 antialiased px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header Navigation Section */}
        <div className="mb-10 border-b border-slate-800/80 pb-6">
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors">
            &larr; Dashboard Console
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-3">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Global hiring infrastructure telemetry and yield maps.</p>
        </div>

        {/* Summary cards dashboard matrix row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-10">
          <SummaryCard label="Total Submissions" value={totalApplications} />
          <SummaryCard 
            label="Hired Profiles"    
            value={hiredCount}    
            sub={`${totalApplications > 0 ? Math.round(hiredCount / totalApplications * 100) : 0}% aggregate yield`} 
          />
          <SummaryCard label="Archived Records" value={rejectedCount} />
          <SummaryCard 
            label="Mean Time-To-Hire" 
            value={avgDays !== null ? `${avgDays}d` : '—'} 
            sub="Ingestion to conversion velocity" 
          />
        </div>

        {/* Middle row data visualization panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Hiring funnel visual card */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Active Pipeline Volume</h2>
            <p className="text-xs text-slate-500 mb-6">Distribution density of unarchived application rows</p>

            {funnelRows.length === 0 ? (
              <div className="border border-dashed border-slate-800/60 rounded-xl p-10 text-center text-slate-600 font-bold uppercase tracking-wider text-xs">
                No active funnel context
              </div>
            ) : (
              <div className="space-y-1">
                {funnelRows.map((row) => (
                  <Bar
                    key={row.name}
                    label={row.name}
                    count={row.count}
                    total={activeCount}
                    color={row.color}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Application status outcomes chart */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Application Track Outcomes</h2>
            <p className="text-xs text-slate-500 mb-6">Macro routing terminations across all historical entries</p>

            <div className="space-y-1">
              <Bar label="Active Tracks"   count={activeCount}   total={totalApplications} color="#818cf8" />
              <Bar label="Hired Rows"     count={hiredCount}    total={totalApplications} color="#34d399" />
              <Bar label="Archived Rows"  count={rejectedCount} total={totalApplications} color="#f43f5e" />
            </div>
          </div>

        </div>

        {/* Rating distribution charting center */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 mb-8 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Scorecard Assessment Distribution</h2>
          <p className="text-xs text-slate-500 mb-6">
            {totalRatings} total operational review matrix file payload{totalRatings !== 1 ? 's' : ''} ingested
          </p>

          {totalRatings === 0 ? (
            <div className="border border-dashed border-slate-800/60 rounded-xl p-10 text-center text-slate-600 font-bold uppercase tracking-wider text-xs">
              No evaluation rows submitted
            </div>
          ) : (
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <Bar
                  key={star}
                  label={`${'★'.repeat(star)}${'☆'.repeat(5 - star)}  ${['', 'POOR', 'FAIR', 'GOOD', 'GREAT', 'EXCELLENT'][star]}`}
                  count={ratingMap[star] ?? 0}
                  total={totalRatings}
                  color={['', '#f43f5e', '#fbbf24', '#60a5fa', '#818cf8', '#34d399'][star]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Per-job ledger matrix data grid table */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl shadow-black overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Yield Mapping Per Position</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800">
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Position Identifier Track</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Hiring Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Ingested Rows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobStats.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/30 transition-colors group">
                    {/* Job Title Linked Column */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="font-bold text-white hover:text-indigo-400 transition-colors"
                      >
                        {job.title}
                      </Link>
                    </td>
                    
                    {/* Role Enums Status Pill */}
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${JOB_STATUS_STYLES[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                    
                    {/* Aggregated Application Row Sums */}
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-300">
                      {job._count.applications}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}