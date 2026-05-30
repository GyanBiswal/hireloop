// app/components/ApplicationStatusButtons.js
//
// Client component — Hire and Reject buttons on the application detail page.
// Separated into its own file because it needs useState + fetch (client-side).
// The parent page is a Server Component so this lives here instead.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApplicationStatusButtons({ jobId, appId, currentStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState(null) // 'HIRED' | 'REJECTED' | null

  // If already finalised, show a read-only badge instead of buttons
  if (currentStatus !== 'ACTIVE') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold
        ${currentStatus === 'HIRED'    ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {currentStatus === 'HIRED' ? '🎉 Hired' : '❌ Rejected'}
      </div>
    )
  }

  async function handleAction(status) {
    const label = status === 'HIRED' ? 'hire' : 'reject'
    if (!confirm(`Are you sure you want to ${label} this candidate?`)) return

    setLoading(status)

    const res = await fetch(`/api/jobs/${jobId}/applications/${appId}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })

    setLoading(null)

    if (res.ok) {
      // Refresh the server component — re-fetches the application with updated status
      // and re-renders the audit timeline with the new HIRED/REJECTED log entry
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Something went wrong.')
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction('HIRED')}
        disabled={!!loading}
        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400
                   text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {loading === 'HIRED' ? 'Saving…' : '🎉 Hire'}
      </button>
      <button
        onClick={() => handleAction('REJECTED')}
        disabled={!!loading}
        className="px-4 py-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-50
                   text-red-600 border border-red-200 text-sm font-semibold rounded-lg transition-colors"
      >
        {loading === 'REJECTED' ? 'Saving…' : '❌ Reject'}
      </button>
    </div>
  )
}