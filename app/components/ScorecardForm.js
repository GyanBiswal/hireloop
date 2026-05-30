// app/components/ScorecardForm.js
//
// Client component — interactive multi-criteria scorecard form.
// Separated from the server component because it needs useState for
// various ratings, text area inputs, and form submission execution.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SCORING_CATEGORIES = [
  { key: 'technicalAbility', label: 'Technical Ability' },
  { key: 'communication',    label: 'Communication' },
  { key: 'problemSolving',   label: 'Problem Solving' },
  { key: 'cultureFit',       label: 'Culture Fit' },
]

const RECOMMENDATIONS = [
  { value: 'STRONG_HIRE',   label: 'Strong Hire',    style: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
  { value: 'HIRE',          label: 'Hire',           style: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' },
  { value: 'NO_HIRE',       label: 'No Hire',        style: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
  { value: 'STRONG_NO_HIRE',label: 'Strong No Hire', style: 'border-rose-500/30 text-rose-400 bg-rose-500/5' },
]

export default function ScorecardForm({ jobId, appId, candidateName = "John Doe" }) {
  const router = useRouter()
  
  // Form values matching your structured interview parameters
  const [interviewType, setInterviewType] = useState('TECHNICAL')
  const [ratings, setRatings] = useState({
    technicalAbility: 0,
    communication: 0,
    problemSolving: 0,
    cultureFit: 0,
  })
  const [strengths, setStrengths] = useState('')
  const [concerns, setConcerns] = useState('')
  const [recommendation, setRecommendation] = useState('HIRE')

  // Operational pipeline trackers
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Single scope handler to map multi-star selections
  const handleRatingSelect = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validate that every distinct scoring criteria has been recorded
    const missingFields = Object.entries(ratings).filter(([_, val]) => val === 0)
    if (missingFields.length > 0) {
      setError('Please provide a score for all required technical valuation matrices.')
      return
    }

    setLoading(true)

    const res = await fetch(`/api/jobs/${jobId}/applications/${appId}/scorecard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewType,
        ...ratings,
        strengths,
        concerns,
        recommendation,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to transmit evaluation payload structure.')
      return
    }

    // Flush fields to unpopulated baseline state on execution success
    setRatings({ technicalAbility: 0, communication: 0, problemSolving: 0, cultureFit: 0 })
    setStrengths('')
    setConcerns('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-200 antialiased">
      
      {/* Dynamic Security/Validation Errors */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400 flex items-center gap-2 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>{error}</span>
        </div>
      )}

      {/* Meta context showing candidate identifier */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Evaluating Profile</span>
        <span className="text-xs font-bold text-white font-mono">{candidateName}</span>
      </div>

      {/* Interview Type Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Interview Vector
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['PHONE_SCREEN', 'TECHNICAL', 'FINAL_ROUND'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setInterviewType(type)}
              className={`py-2 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                interviewType === type
                  ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-900/10 text-slate-400 hover:bg-slate-900/40'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Criteria Scoring Blocks */}
      <div className="space-y-3.5 bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl">
        {SCORING_CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900/60 last:border-0 pb-3 last:pb-0">
            <span className="text-xs font-semibold text-slate-300">{cat.label}</span>
            <div className="flex items-center gap-1 bg-black px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleRatingSelect(cat.key, num)}
                  className={`h-6 w-6 rounded text-xs font-bold font-mono transition-all ${
                    ratings[cat.key] === num
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Text Logs Context Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Identified Strengths</label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
            placeholder="Log code design capabilities, pattern recognition skills..."
            className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Technical Concerns</label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            rows={3}
            placeholder="Log processing inefficiencies, architecture layout gaps..."
            className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Hiring Decision Recommendation */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Hiring Signal Recommendation
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RECOMMENDATIONS.map((rec) => (
            <button
              key={rec.value}
              type="button"
              onClick={() => setRecommendation(rec.value)}
              className={`py-2.5 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-center transition-all ${
                recommendation === rec.value
                  ? `${rec.style} ring-1 ring-offset-black`
                  : 'border-slate-800 bg-slate-900/10 text-slate-500 hover:bg-slate-900/30 hover:text-slate-300'
              }`}
            >
              {rec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Submission Action */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400/40 disabled:text-slate-500 py-3.5 text-xs font-bold text-white transition-all shadow-md active:scale-[0.99] pt-3"
      >
        {loading ? 'Transmitting Ingestion Scorecard Payload…' : 'Submit Scorecard Sequence'}
      </button>

    </form>
  )
}