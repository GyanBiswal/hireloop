// middleware.js
//
// Next.js middleware runs at the "Edge" — BEFORE any page or API route renders.
// Think of it as a bouncer at the door: it checks credentials before letting
// anyone into the building, not after they're already inside.
//
// WHY this is more secure than checking auth inside a component:
// If you check auth inside a Server Component, Next.js has already started
// rendering the page, loaded imports, and potentially fetched data.
// Middleware stops the request at the network layer — zero page code runs.
//
// WHY it runs at the "Edge":
// Edge = lightweight V8 isolate (like Cloudflare Workers), NOT a full Node.js server.
// It has no file system, no native modules, and — crucially — no Prisma.
// That's exactly why we store role in the JWT: the Edge can read a cookie
// but cannot query a database. Fast, cheap, runs in every region globally.

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  // This function runs AFTER withAuth has verified the JWT is valid.
  // `req.nextauth.token` contains the decoded JWT (id, email, role, etc.)
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    // INTERVIEWER role cannot access anything under /admin/*
    // Redirect them to the dashboard instead of showing a 403 error
    if (pathname.startsWith('/admin') && role === 'INTERVIEWER') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // All other authenticated users: allow the request through
    return NextResponse.next()
  },
  {
    callbacks: {
      // `authorized` runs first, before the middleware function above.
      // Return true = user is allowed to proceed; false = redirect to login page.
      // If the token is null (no cookie / expired), this returns false
      // and NextAuth automatically redirects to our /login page.
      authorized({ token }) {
        return !!token // !! converts null/undefined to false, object to true
      },
    },
  }
)

// `matcher` tells Next.js WHICH routes this middleware applies to.
// Routes NOT listed here are public — no auth check at all.
// We protect /dashboard/* and /admin/* but leave / and /login and /jobs/* public.
export const config = {
  matcher: [
    '/dashboard/:path*', // matches /dashboard, /dashboard/jobs, /dashboard/jobs/123, etc.
    '/admin/:path*',     // matches /admin, /admin/users, etc.
  ],
}