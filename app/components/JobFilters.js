// app/components/JobFilters.js
//
// Client component — search box and status filter for the jobs list.
// WHY URL params instead of useState:
//   - The jobs list page is a Server Component. It can't receive state from a
//     client component directly.
//   - By writing filters into the URL, the Server Component reads them from
//     searchParams and runs the Prisma query with the right WHERE clause.
//   - The URL is also shareable: paste it and you get the same filtered view.
//   - This pattern is called "URL as state" — a senior-level concept worth
//     mentioning in interviews.

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUS_OPTIONS = ['ALL', 'OPEN', 'DRAFT', 'CLOSED']

export default function JobFilters() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // Read current filter values from the URL
  const currentStatus = searchParams.get('status') || 'ALL'
  const currentQ      = searchParams.get('q')      || ''

  // Helper: build a new URL with updated params without losing existing ones
  // e.g. setParam('status', 'OPEN') → /dashboard/jobs?q=engineer&status=OPEN
  const setParam = useCallback((key, value) => {
    // URLSearchParams is a browser API for manipulating query strings safely
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') {
      params.set(key, value)
    } else {
      params.delete(key) // remove param entirely when value is empty/ALL
    }
    // Reset to page 1 whenever a filter changes
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8 text-slate-200 antialiased">
      {/* Search input text element */}
      <div className="relative">
        <input
          type="text"
          placeholder="Filter by position..."
          defaultValue={currentQ}
          // Use onBlur + Enter key instead of onChange to avoid a router.push on every keystroke
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('q', e.target.value.trim())
          }}
          onBlur={(e) => setParam('q', e.target.value.trim())}
          className="px-3.5 py-2 w-64 rounded-xl border border-slate-800 bg-slate-900/40 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* Status filter pill configuration */}
      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900/60 p-1 rounded-xl shadow-inner">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setParam('status', status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              currentStatus === status
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Clear filters trigger button — only active during modified URL states */}
      {(currentStatus !== 'ALL' || currentQ) && (
        <button
          onClick={() => router.push(pathname)}
          className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/10 bg-rose-500/5 hover:border-rose-500/20 rounded-lg shadow-sm"
        >
          Clear Pipeline Filters
        </button>
      )}
    </div>
  )
}