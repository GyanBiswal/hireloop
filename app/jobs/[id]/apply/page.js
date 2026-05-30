// app/jobs/[id]/apply/page.js
//
// PUBLIC apply page — no authentication required.
// Any candidate can visit this URL and submit an application.
// We fetch only the job title and department (nothing sensitive like salaries or
// internal notes) so candidates see just what they need to fill out the form.

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function ApplyPage() {
  const { id } = useParams() // reads the [id] from the URL

  // Job info displayed at the top of the page
  const [job,     setJob]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [form, setForm] = useState({ name: '', email: '', phone: '', resumeUrl: '' })
  const [errors,   setErrors]   = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false) // shows thank-you screen on success
  const [apiError,   setApiError]   = useState('')

  // Fetch just the job title + department on mount (public GET /api/jobs returns all jobs,
  // so we filter client-side — in a real app you'd add a public GET /api/jobs/[id] route)
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch('/api/jobs')
        if (!res.ok) throw new Error()
        const jobs = await res.json()
        const found = jobs.find((j) => j.id === id)
        setJob(found || null)
      } catch {
        setJob(null)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setApiError('')

    const res = await fetch(`/api/jobs/${id}/apply`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      if (data.error === 'DUPLICATE_APPLICATION') {
        setApiError("You've already applied to this position.")
        return
      }
      if (data.fields) {
        const flat = {}
        for (const [key, messages] of Object.entries(data.fields)) {
          flat[key] = messages[0]
        }
        setErrors(flat)
        return
      }
      setApiError(data.error || 'Something went wrong. Please try again.')
      return
    }

    setSubmitted(true) // flip to thank-you screen
  }

  // Refactored input token class mapping for clean absolute dark contrast states
  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1
     focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-900/40 text-white placeholder:text-slate-600
     ${errors[field] ? 'border-rose-500/40 bg-rose-500/10 focus:ring-rose-500/30 focus:border-rose-500' : 'border-slate-800'}`

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-200 antialiased flex items-center justify-center">
        <p className="text-slate-500 text-xs font-mono tracking-wider uppercase animate-pulse">Loading Position Context…</p>
      </div>
    )
  }

  // ── Job not found ──
  if (!job) {
    return (
      <div className="min-h-screen bg-black text-slate-200 antialiased flex items-center justify-center p-6">
        <div className="text-center max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-8 shadow-2xl shadow-black">
          <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">Position Not Active</p>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">This hiring rail has closed, filled, or the parameters have been modified by the job administrator.</p>
        </div>
      </div>
    )
  }

  // ── Thank-you screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-slate-200 antialiased flex items-center justify-center p-6">
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl shadow-black p-8 max-w-md w-full text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-lg mb-4">✓</div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-2">Application Transmitted</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your materials for <strong className="text-white font-semibold">{job.title}</strong> have been saved to the pipeline ledger. The recruiting desk will review your profile metrics shortly.
          </p>
        </div>
      </div>
    )
  }

  // ── Apply form ──
  return (
    <div className="min-h-screen bg-black text-slate-200 antialiased selection:bg-indigo-500/30 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      {/* Structural Geometry Mesh Sync */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="w-full max-w-lg relative z-10">

        {/* Header Block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-tight text-slate-400 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-black text-white shadow-sm">H</span>
            Hire<span className="-ml-[1px] text-indigo-400">Loop Portal</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">{job.title}</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5">{job.department} &middot; {job.location}</p>
        </div>

        {/* Central Form Console Card */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl shadow-black p-6 sm:p-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 border-b border-slate-800/80 pb-3">Candidate Record Info</h2>

          {apiError && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="Jane Smith" className={inputClass('name')} />
              {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="jane@example.com" className={inputClass('email')} />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Contact Phone <span className="text-rose-400">*</span>
              </label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="+1 555 000 0000" className={inputClass('phone')} />
              {errors.phone && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Resume Repository URL <span className="text-slate-600 font-medium lowercase"> (optional)</span>
              </label>
              <input name="resumeUrl" type="url" value={form.resumeUrl} onChange={handleChange}
                placeholder="https://linkedin.com/in/yourname" className={inputClass('resumeUrl')} />
              {errors.resumeUrl && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.resumeUrl}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-4 py-3 text-xs font-bold text-white transition-all shadow-sm hover:shadow active:scale-[0.99] mt-2"
            >
              {submitting ? 'Transmitting Ingestion Payload…' : 'Submit Application'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}