// app/providers.js
//
// SessionProvider from next-auth/react uses React Context to make the session
// available to ALL client components via useSession() — without prop drilling.
//
// WHY this needs to be a separate file with 'use client':
// app/layout.js is a Server Component by default.
// SessionProvider uses React Context, which requires the browser's React runtime.
// Server Components cannot use Context. So we wrap SessionProvider in its own
// Client Component and import that into the layout.
// This is the standard Next.js 13+ pattern for mixing server and client code.

'use client'

import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }) {
  return (
    // Pass the session down to every child component in the tree.
    // Any 'use client' component can now call useSession() to get the user.
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}