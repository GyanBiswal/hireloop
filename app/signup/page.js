'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ARCHITECTURE_HIGHLIGHTS = [
  {
    title: 'NextAuth Role Isolation',
    desc: 'Automatic routing guards for Admins, Recruiters, and Interviewers.',
    icon: (
      <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    title: 'Atomic Prisma Pipelines',
    desc: 'Jobs initialize instantly with 5-stage transactional integrity.',
    icon: (
      <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    title: 'Isolated Scorecard Logics',
    desc: 'Self-referral blocking constraints baked directly into the API layer.',
    icon: (
      <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  }
]

export default function SignupPage() {
  const router = useRouter()

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [intendedRole, setIntendedRole] = useState('RECRUITER') // Matches your schema tokens

  // UI status track
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: intendedRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed.')
        setLoading(false)
        return
      }

      // Execute auto-login pipeline stage via credentials provider
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account generated, but system authentication timed out.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Network communication drop. Verify cluster endpoints.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-2 antialiased selection:bg-indigo-500/20">

      {/* ── LEFT ACCENT PANEL ─────────────────────────── */}
      <div className="hidden lg:flex relative overflow-hidden bg-slate-900 border-r border-slate-800 text-white p-12 flex-col justify-between">
        
        {/* Engineering Background Geometry */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(circle_at_bottom_left,transparent_40%,#000_100%)] opacity-15" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[120px]" />

        <Link href="/" className="relative z-10 flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white shadow-sm">H</span>
          Hire<span className="-ml-[1px] text-indigo-400">Loop</span>
        </Link>

        <div className="max-w-md relative z-10 my-auto space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700/60">
              System Console v1.0.4
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mt-4 leading-[1.15]">
              Deploy structured candidate pipelines in seconds.
            </h1>
          </div>

          {/* Architecture Items replacing standard circles */}
          <div className="space-y-4">
            {ARCHITECTURE_HIGHLIGHTS.map((item) => (
              <div key={item.title} className="flex gap-3.5 items-start p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 backdrop-blur-sm">
                <div className="mt-0.5 p-1 rounded-lg bg-slate-800 border border-slate-700/50">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Pipeline Visualization Footnote */}
        <div className="relative z-10 flex items-center gap-2 border-t border-slate-800/80 pt-6">
          <div className="flex -space-x-1">
            {['A', 'S', 'I', 'O', 'H'].map((char, index) => (
              <div key={index} className="h-5 w-8 rounded bg-slate-800 border border-slate-700 text-[9px] font-black tracking-tighter flex items-center justify-center text-slate-400">
                {char}
              </div>
            ))}
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            Prisma transactional schema mapping active.
          </p>
        </div>
      </div>

      {/* ── RIGHT SIGNUP CONTAINER ────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white shadow-sm">H</span>
              Hire<span className="-ml-[1px] text-indigo-600">Loop</span>
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Create account</h2>
            <p className="text-xs text-slate-400 mt-1">Set up credentials to initialize your role context configuration.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs font-medium text-rose-700 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sjenkins@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Access Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Interactive Workspace Intended Role Selection (Direct UI justification for Backend Steps 1 & 2) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Initial Account Context</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIntendedRole('RECRUITER')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    intendedRole === 'RECRUITER'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Recruiter</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Build jobs & transition tracks</p>
                </button>

                <button
                  type="button"
                  onClick={() => setIntendedRole('ADMIN')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    intendedRole === 'ADMIN'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Admin Manager</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Full pipeline analytics audit</p>
                </button>
              </div>
            </div>

            {/* Action Controller */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-4 py-3 text-xs font-bold text-white transition-all shadow-sm hover:shadow active:scale-[0.99] mt-2"
            >
              {loading ? 'Executing Secure Provisioning...' : 'Provision New Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Existing authorization verified?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign in to Session
            </Link>
          </div>

        </div>
      </div>

    </div>
  )
}   