// app/dashboard/jobs/new/page.js
//
// Create Job form — client component because it manages form state and
// makes a fetch() call to POST /api/jobs.
// On success redirects to the jobs list.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewJobPage() {
  const router = useRouter()

  // One state object for all form fields — easier than 5 separate useState calls
  const [form, setForm] = useState({
    title:       '',
    department:  '',
    description: '',
    location:    '',
    status:      'DRAFT', // default to DRAFT so jobs aren't accidentally published
  })

  const [errors,  setErrors]  = useState({}) // field-level errors from Zod
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('') // top-level error (e.g. network failure)

  // Single change handler for all fields — reads the input's `name` attribute
  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear the error for this field as the user types
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setApiError('')

    const res = await fetch('/api/jobs', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (data.fields) {
        // Zod field-level errors — show each error under its input
        // data.fields looks like: { title: ['Title is required'], ... }
        const flat = {}
        for (const [key, messages] of Object.entries(data.fields)) {
          flat[key] = messages[0] // show only first error per field
        }
        setErrors(flat)
      } else {
        setApiError(data.error || 'Something went wrong. Please try again.')
      }
      return
    }

    // Success — navigate to the jobs list
    router.push('/dashboard/jobs')
  }

  // Reusable input class — upgraded to match premium dark console tokens
  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1
     focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-900/40 text-white placeholder:text-slate-600
     ${errors[field] ? 'border-rose-500/40 bg-rose-500/10 focus:ring-rose-500/30 focus:border-rose-500' : 'border-slate-800'}`

  return (
    <div className="min-h-screen bg-black text-slate-200 antialiased px-6 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Page header */}
        <div className="mb-8 border-b border-slate-800/80 pb-6">
          <Link href="/dashboard/jobs" className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-3">Create New Job</h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            5 default pipeline stages will be created automatically via atomic database transaction.
          </p>
        </div>

        {/* Form Console Container */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-2xl shadow-black p-6 sm:p-8">
          
          {/* Top-level API error */}
          {apiError && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Job Title <span className="text-rose-400">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Engineer"
                className={inputClass('title')}
              />
              {errors.title && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.title}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Department <span className="text-rose-400">*</span>
              </label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Engineering"
                className={inputClass('department')}
              />
              {errors.department && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.department}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Location <span className="text-rose-400">*</span>
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Remote or New York, NY"
                className={inputClass('location')}
              />
              {errors.location && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.location}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the role, responsibilities, and requirements..."
                className={inputClass('description')}
              />
              {errors.description && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.description}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Status <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={`${inputClass('status')} appearance-none cursor-pointer pr-10`}
                >
                  <option value="DRAFT" className="bg-slate-900 text-white">DRAFT — not visible to applicants</option>
                  <option value="OPEN" className="bg-slate-900 text-white">OPEN — accepting applications</option>
                </select>
                {/* Custom dropdown indicator chevron for styling uniformity */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.status && <p className="mt-1.5 text-xs font-medium text-rose-400">{errors.status}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                           text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.99]"
              >
                {loading ? 'Executing Creation Sequence…' : 'Create Job'}
              </button>
              <Link
                href="/dashboard/jobs"
                className="flex-1 py-3 text-center border border-slate-800 bg-slate-900/20 hover:bg-slate-900/50
                           text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.99]"
              >
                Cancel
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}