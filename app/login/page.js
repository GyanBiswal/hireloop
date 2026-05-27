'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  // Form field states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // UI operation track
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid authorization token signature or password. Check cluster credentials.')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Structural Geometry Mesh Sync */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="pointer-events-none absolute h-[400px] w-[600px] rounded-full bg-indigo-500/5 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />

      <div className="w-full max-w-sm relative z-10">
        
        {/* Core Console Container */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl shadow-black p-7 sm:p-8">
          
          {/* Header Identity */}
          <div className="mb-7 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-black text-white shadow-sm">H</span>
              Hire<span className="-ml-[1px] text-indigo-400">Loop</span>
            </Link>
            <p className="mt-1.5 text-xs text-slate-400">Initialize identity provider session context</p>
          </div>

          {/* Action Intercept Warning Block */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}

          {/* Core Transactional Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Corporate Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-2.5 text-xs text-white shadow-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Access Token Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-2.5 text-xs text-white shadow-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-4 py-3 text-xs font-bold text-white transition-all shadow-sm hover:shadow active:scale-[0.99] mt-2"
            >
              {loading ? 'Authorizing Cluster Stream...' : 'Initialize Session'}
            </button>
          </form>

          {/* Interactive Internal Sandbox Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sandbox Identities</span>
              <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">Click to Inject</span>
            </div>
            
            <div className="space-y-1.5">
              {[
                { email: 'admin@hireloop.com',       password: 'admin123',       role: 'ADMIN',       badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                { email: 'recruiter@hireloop.com',   password: 'recruiter123',   role: 'RECRUITER',   badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                { email: 'interviewer@hireloop.com', password: 'interviewer123', role: 'INTERVIEWER', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              ].map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => { setEmail(account.email); setPassword(account.password) }}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/50 hover:border-slate-700 transition-all duration-150 flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white">{account.email}</span>
                    <span className="text-[10px] font-medium text-slate-500 font-mono mt-0.5">pass: {account.password}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold tracking-wider border px-1.5 py-0.5 rounded ${account.badgeColor}`}>
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Need an enterprise space?{' '}
            <Link href="/signup" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Deploy Context
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}