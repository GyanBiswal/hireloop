// app/dashboard/jobs/page.js
//
// Jobs list with search, status filter, and pagination.
// Server Component — reads filter values from URL searchParams and
// passes them directly to Prisma's WHERE clause.
//
// searchParams is provided automatically by Next.js App Router to
// page components — no need to parse the URL manually.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import JobFilters from '@/app/components/JobFilters'

// High-contrast translucent status indicators tailored for dark layouts
const STATUS_STYLES = {
  OPEN:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DRAFT:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CLOSED: 'bg-slate-800 text-slate-400 border-slate-700/60',
}

// How many job cards to show per page
const PAGE_SIZE = 9

export default async function JobsPage({ searchParams }) {
  const sp = await searchParams
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  // if (!['ADMIN', 'RECRUITER'].includes(session.user.role)) redirect('/dashboard')

  // Read filter values from the URL query string
  const status = sp?.status || null
  const q = sp?.q || ''
  const page = Math.max(1, parseInt(sp?.page || '1', 10))
  // Math.max(1, ...) prevents page=0 or page=-1 from being used

  // Build the Prisma WHERE clause dynamically based on which filters are active
  const where = {
    // Only add status filter if one is selected (not ALL)
    ...(status ? { status } : {}),
    // Only add title search if the query string is non-empty
    ...(q ? {
      title: {
        contains: q,
        mode: 'insensitive', // case-insensitive search — "engineer" matches "Engineer"
      }
    } : {}),
  }

  // Run count + data queries in parallel for performance
  const [total, jobs] = await Promise.all([
    // Total count with the same WHERE — needed to calculate total pages
    prisma.job.count({ where }),

    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      // Pagination: skip = how many records to skip before this page
      // e.g. page 2, PAGE_SIZE 9 → skip 9, take 9
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
      include: {
        createdBy: { select: { name: true } },
        _count:    { select: { applications: true } },
      },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-black text-slate-200 antialiased px-6 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header Block Panel */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Jobs Console</h1>
            <p className="text-sm text-slate-400 mt-1">
              {total} positions matching your database queries
            </p>
          </div>
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.99] self-start sm:self-center"
          >
            + Create New Position
          </Link>
        </div>

        {/* Search + filter bar — client component input pipeline */}
        <JobFilters />

        {/* Empty dashboard pipeline handler state */}
        {jobs.length === 0 && (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 max-w-xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400">No pipelines located</p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Modify your filter tokens or search string query parameters.</p>
          </div>
        )}

        {/* Position card index matrices grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="block bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/80 p-5 shadow-sm hover:border-slate-700/80 hover:bg-slate-900/60 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <h2 className="font-bold text-white text-sm tracking-tight leading-snug group-hover:text-indigo-400 transition-colors duration-150">
                  {job.title}
                </h2>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_STYLES[job.status]}`}>
                  {job.status}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 font-medium">
                {job.department} &middot; {job.location}
              </p>
              
              <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span className="font-semibold tracking-wide text-slate-400">
                  {job._count.applications} applicant{job._count.applications !== 1 ? 's' : ''}
                </span>
                <span>by {job.createdBy.name}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* System tracking page indices block */}
        {totalPages > 1 && jobs.length > 0 && (
          <div className="mt-12 border-t border-slate-800/60 pt-6">
            <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
          </div>
        )}

      </div>
    </div>
  )
}

// Pagination component — renders prev/next + page number buttons.
// Builds URLs with all existing search params preserved so filters
// don't reset when you change page.
function Pagination({ page, totalPages, searchParams }) {
  function buildPageUrl(p) {
    const params = new URLSearchParams()
    // Carry over all existing search params (status, q) into the page URL
    if (searchParams?.status) params.set('status', searchParams.status)
    if (searchParams?.q)      params.set('q',      searchParams.q)
    params.set('page', String(p))
    return `/dashboard/jobs?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-center gap-1.5 text-slate-200">
      {/* Previous layout trigger button */}
      {page > 1 ? (
        <Link href={buildPageUrl(page - 1)}
          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-slate-800 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all shadow-sm">
          &larr; Prev
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 border border-slate-900/60 bg-slate-950/20 rounded-xl cursor-not-allowed select-none">
          &larr; Prev
        </span>
      )}

      {/* Page number button layout loops */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={buildPageUrl(p)}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all shadow-sm ${
            p === page
              ? 'bg-indigo-600 text-white font-black'
              : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          {p}
        </Link>
      ))}

      {/* Next layout trigger button */}
      {page < totalPages ? (
        <Link href={buildPageUrl(page + 1)}
          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-slate-800 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all shadow-sm">
          Next &rarr;
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 border border-slate-900/60 bg-slate-950/20 rounded-xl cursor-not-allowed select-none">
          Next &rarr;
        </span>
      )}
    </div>
  )
}