// app/components/KanbanBoard.js
//
// Client-side Kanban board — renders pipeline stages as columns and
// candidate cards as draggable items within those columns.
//
// WHY a client component:
// Drag-and-drop requires browser events (mousedown, dragover, drop).
// These don't exist on the server. So this MUST be 'use client'.
//
// HOW drag-and-drop works (using HTML5 native API — no extra library):
// 1. User grabs a card → onDragStart stores the applicationId in dataTransfer
// 2. User drags over a column → onDragOver prevents default (allows drop)
// 3. User drops on a column → onDrop reads applicationId, calls the API
//
// WHY no library: The HTML5 drag API is built into every browser.
// Adding a library just for this would be a dependency for something
// we can explain and control ourselves — better for interviews too.

'use client'

import { useState } from 'react'
import Link from 'next/link'

// SLA threshold: 7 days in milliseconds
// If a candidate has been in their current stage longer than this, show a red badge
const SLA_MS = 7 * 24 * 60 * 60 * 1000

// Check if an application has breached the 7-day SLA
// updatedAt is the last time the application row was touched (stage move updates it)
function isSlaBreached(updatedAt) {
  return Date.now() - new Date(updatedAt).getTime() > SLA_MS
}

// Star rating display component — renders filled/empty stars for scorecards
function Stars({ rating }) {
  return (
    <span className="text-amber-400 font-mono tracking-tight text-xs">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function KanbanBoard({ stages, initialApplications, jobId, userRole }) {
  // We keep applications in local state so the UI updates instantly on drop
  // without waiting for a full page reload (optimistic-style update)
  const [applications, setApplications] = useState(initialApplications)
  const [dragError, setDragError] = useState('')

  // Called when the user starts dragging a card
  // We store the application ID in the drag event so onDrop knows what was dragged
  function handleDragStart(e, applicationId) {
    e.dataTransfer.setData('applicationId', applicationId)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Must call preventDefault to tell the browser "yes, dropping is allowed here"
  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Called when the card is dropped onto a stage column
  async function handleDrop(e, targetStageId) {
    e.preventDefault()
    setDragError('')

    const applicationId = e.dataTransfer.getData('applicationId')
    if (!applicationId) return

    // Find the application being moved
    const app = applications.find((a) => a.id === applicationId)
    if (!app) return

    // No-op: dropped onto the same column
    if (app.currentStageId === targetStageId) return

    // ONLY ADMIN and RECRUITER can move cards — INTERVIEWER sees the board read-only
    if (!['ADMIN', 'RECRUITER'].includes(userRole)) {
      setDragError('Security Intercept: Lacking sufficient validation privileges to modify column indices.')
      return
    }

    // Optimistic update: move the card in local state IMMEDIATELY
    // so the UI feels instant, even before the API responds
    // If the API fails, we roll back to the original state
    const previousApplications = applications
    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId
          ? { ...a, currentStageId: targetStageId }
          : a
      )
    )

    // Call the stage move API
    const res = await fetch(
      `/api/jobs/${jobId}/applications/${applicationId}/stage`,
      {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ newStageId: targetStageId }),
      }
    )

    if (!res.ok) {
      // Rollback the optimistic update if the API failed
      setApplications(previousApplications)
      const data = await res.json()
      setDragError(data.error || 'Database pipeline adjustment rejected. Please re-authenticate context.')
    }
  }

  return (
    <div className="text-slate-200 antialiased">
      {/* Error banner — shown if a drag-and-drop API call fails */}
      {dragError && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400 flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{dragError}</span>
          </div>
          <button onClick={() => setDragError('')} className="text-rose-300 hover:text-rose-100 underline font-bold transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* Kanban columns — one per pipeline stage, scrollable horizontally */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800">
        {stages.map((stage) => {
          // Filter applications that are currently in this stage
          const stageApps = applications.filter((a) => a.currentStageId === stage.id)

          return (
            <div
              key={stage.id}
              // onDragOver + onDrop make this column a valid drop target
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="shrink-0 w-64 flex flex-col rounded-2xl bg-slate-900/20 backdrop-blur-sm
                         border border-slate-800/80 min-h-[450px]"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3.5 py-3
                              border-b border-slate-800 bg-slate-950/40 rounded-t-2xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Color dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/40 shadow-sm"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-xs font-bold text-slate-200 truncate tracking-wide">
                    {stage.name}
                  </span>
                </div>
                {/* Card count badge */}
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 border border-slate-800
                                 rounded-md px-1.5 py-0.5 shrink-0">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2.5 p-2.5 flex-1 overflow-y-auto">
                {stageApps.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/60 rounded-xl m-0.5">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 text-center">Drop Context</p>
                  </div>
                )}

                {stageApps.map((app) => {
                  const slaBreached = isSlaBreached(app.updatedAt)
                  const avgRating = app.scorecards.length > 0
                    ? (app.scorecards.reduce((sum, s) => sum + s.rating, 0) / app.scorecards.length).toFixed(1)
                    : null

                  return (
                    <div
                      key={app.id}
                      // draggable makes this element draggable in the browser
                      draggable={['ADMIN', 'RECRUITER'].includes(userRole)}
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className={`bg-slate-950 rounded-xl border p-3.5 shadow-md
                                  transition-all duration-200 select-none
                                  ${['ADMIN', 'RECRUITER'].includes(userRole) ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}
                                  ${slaBreached 
                                    ? 'border-rose-500/40 bg-gradient-to-b from-slate-950 to-rose-950/10' 
                                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'}`}
                    >
                      {/* SLA breach warning */}
                      {slaBreached && (
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                          {/* Red dot indicator */}
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          SLA Breach &bull; 7d+ Stall
                        </div>
                      )}

                      {/* Candidate name */}
                      <p className="text-xs font-bold text-white mb-0.5 tracking-tight">
                        {app.candidate.name}
                      </p>

                      {/* Candidate email */}
                      <p className="text-[11px] font-medium text-slate-400 mb-2 truncate">
                        {app.candidate.email}
                      </p>

                      {/* Applied date */}
                      <p className="text-[10px] font-medium text-slate-500 mb-3 border-b border-slate-900 pb-2">
                        Applied {new Date(app.appliedAt).toLocaleDateString('en-GB')}
                      </p>

                      {/* Footer actions block unifies scoring metrics and navigational controls */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/* Scorecard average — only shown if at least one scorecard exists */}
                        {avgRating ? (
                          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/60 px-1.5 py-0.5 rounded-md shrink-0">
                            <Stars rating={Math.round(Number(avgRating))} />
                            <span className="text-[9px] font-bold font-mono text-slate-400">{avgRating}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-600 bg-slate-900/20 px-1.5 py-0.5 rounded border border-slate-800/40">Unrated</span>
                        )}

                        {/* View link to full application detail page */}
                        <Link
                          href={`/dashboard/jobs/${jobId}/applications/${app.id}`}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                          // Stop the click from triggering drag events
                          onClick={(e) => e.stopPropagation()}
                        >
                          Profile &rarr;
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}