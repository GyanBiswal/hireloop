// app/components/Navbar.js
//
// Role-aware top navigation bar. Rendered inside the root layout so it appears
// on every page. Uses useSession() (client-side) to get the current user's
// name and role, then shows/hides links accordingly.
//
// Must be a Client Component because:
// 1. useSession() is a React hook — hooks only work in client components
// 2. signOut() triggers a browser redirect — needs client-side JS

'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Maps each role to a Tailwind color for the badge pill
// Upgraded to alpha-blended transparent dark mode badges for readability
const ROLE_COLORS = {
  ADMIN:       'bg-rose-500/10 text-rose-400 border-rose-500/20',
  RECRUITER:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  INTERVIEWER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export default function Navbar() {
  // useSession() returns { data: session, status: 'loading' | 'authenticated' | 'unauthenticated' }
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Public marketing/auth pages should not show the dashboard navbar
  const hiddenRoutes = ['/', '/login', '/signup']

  if (hiddenRoutes.includes(pathname)) {
    return null
  }

  // While the session is loading, show a minimal placeholder to avoid layout shift
  // Matches the new deep black theme geometry
  if (status === 'loading') {
    return (
      <nav className="h-14 bg-black border-b border-slate-800" />
    )
  }

  const role = session?.user?.role

  // Helper: returns true if this link is the current page (for active styling)
  const isActive = (href) => pathname.startsWith(href)

  return (
    <nav className="h-14 bg-black border-b border-slate-800 sticky top-0 z-50 text-slate-100 antialiased">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">

        {/* ── LEFT: Logo + Nav links ── */}
        <div className="flex items-center gap-8">
          {/* Logo matches landing identity */}
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-black text-white shadow-sm">H</span>
            Hire<span className="-ml-[1px] text-indigo-400">Loop</span>
          </Link>

          {/* Navigation links — shown based on role */}
          <div className="hidden sm:flex items-center gap-1.5">

            {/* ALL roles see Jobs */}
            {['ADMIN', 'RECRUITER', 'INTERVIEWER'].includes(role) && (
              <Link
                href="/dashboard/jobs"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive('/dashboard/jobs')
                    ? 'bg-slate-900 text-white border border-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                Jobs
              </Link>
            )}

            {/* INTERVIEWER sees My Reviews */}
            {role === 'INTERVIEWER' && (
              <Link
                href="/dashboard/reviews"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive('/dashboard/reviews')
                    ? 'bg-slate-900 text-white border border-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                My Reviews
              </Link>
            )}

            {/* ADMIN-only navigation block links */}
            {role === 'ADMIN' && (
              <>
                <Link
                  href="/dashboard/analytics"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/dashboard/analytics')
                      ? 'bg-slate-900 text-white border border-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/admin')
                      ? 'bg-slate-900 text-white border border-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  Admin Panel
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: User info + Sign out ── */}
        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              {/* User name */}
              <span className="text-xs font-medium text-slate-300 hidden sm:block">
                {session.user.name}
              </span>

              {/* Role badge pill with high contrast outline configuration */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wide ${ROLE_COLORS[role] ?? 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                {role}
              </span>

              {/* Sign out button */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                // callbackUrl: where to redirect AFTER sign out completes
                className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 px-2.5 py-1 rounded-lg"
              >
                Sign out
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}