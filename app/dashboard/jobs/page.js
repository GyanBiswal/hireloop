// app/dashboard/jobs/page.js
//
// Jobs list page — shows all jobs with their status, department, location,
// and application count. Accessible to ADMIN and RECRUITER only.
// Server Component: fetches data directly with Prisma — no useEffect, no fetch().

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'

// Color classes for the status badge on each job card
// Remapped to premium alpha-blended transparent dark utility tokens
const STATUS_STYLES = {
  OPEN:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DRAFT:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CLOSED: 'bg-slate-800 text-slate-400 border-slate-700/60',
}

export default async function JobsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Fetch all jobs, newest first, with application count
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { name: true } },
      _count:    { select: { applications: true } },
    },
  })

  return (
    <div className="min-h-screen bg-black text-slate-200 antialiased px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-10 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Jobs</h1>
            <p className="text-sm text-slate-400 mt-1">{jobs.length} total active positions</p>
          </div>
          {/* Create Job button — only ADMIN and RECRUITER see this page so always show */}
          <Link
            href="/dashboard/jobs/new"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs
                       font-bold rounded-xl transition-all shadow-sm active:scale-[0.99]"
          >
            + Create Job
          </Link>
        </div>

        {/* Empty state */}
        {jobs.length === 0 && (
          <div className="text-center py-24 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 max-w-xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-300">No active positions</p>
            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
              Initialize your hiring workflows by generating your first transactional job routing row.
            </p>
          </div>
        )}

        {/* Job cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="block bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-5 shadow-sm
                         hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-200 group"
            >
              {/* Top row: title + status badge */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h2 className="font-bold text-white text-sm leading-snug group-hover:text-indigo-400 transition-colors duration-150">
                  {job.title}
                </h2>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${STATUS_STYLES[job.status]}`}>
                  {job.status}
                </span>
              </div>

              {/* Department + location */}
              <p className="text-xs font-medium text-slate-400">{job.department} &middot; {job.location}</p>

              {/* Footer: application count + created by */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  by <span className="text-slate-400">{job.createdBy.name}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
} 