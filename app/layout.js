// app/layout.js
//
// The root layout wraps EVERY page in the app — it's like the <html> skeleton.
// Next.js App Router requires exactly one root layout that exports metadata
// and renders <html> and <body>.
//
// We wrap everything in <Providers> (our SessionProvider wrapper) so that
// any client component anywhere in the tree can call useSession().

import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import Navbar from './components/Navbar'

// next/font automatically downloads and self-hosts the font (no external request at runtime)
const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HireLoop — Applicant Tracking System',
  description: 'Modern ATS for recruiting teams',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {/* Providers must wrap everything so useSession() works in any child */}
        <Providers>
          {/* Navbar appears on every page (hides itself on /login) */}
          <Navbar />
          {/* Main content area — each page renders here */}
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}