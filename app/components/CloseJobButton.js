// app/components/CloseJobButton.js
// Client component — handles the "Close Job" button click for ADMIN users.
// Separated from the server component because 'use client' can't be used
// inside a file that also contains server-only code.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CloseJobButton({ jobId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClose() {
    if (!confirm('Close this job? No new applications will be accepted.')) return
    setLoading(true)

    const res = await fetch(`/api/jobs/${jobId}/close`, { method: 'PATCH' })
    setLoading(false)

    if (res.ok) {
      // router.refresh() re-runs the Server Component and fetches fresh data
      // without losing client state or doing a full browser reload
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to close job')
    }
  }

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200
                 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
    >
      {loading ? 'Closing…' : 'Close Job'}
    </button>
  )
}