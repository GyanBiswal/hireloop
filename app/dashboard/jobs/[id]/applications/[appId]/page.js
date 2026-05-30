// app/dashboard/jobs/[id]/applications/[appId]/page.js
//
// Application detail page — full profile for a single candidate application.
// Shows: candidate info, scorecard submission form, all submitted scorecards,
// and the complete audit trail (every stage move ever made).
//
// Server Component for data fetching. The scorecard form is a separate
// client component below (ScorecardForm).

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import ScorecardForm from '@/app/components/ScorecardForm'
import ApplicationStatusButtons from '@/app/components/ApplicationStatusButtons'

// Status badge colors
// Remapped to high-contrast dark mode alpha tracking tokens
const STATUS_STYLES = {
  ACTIVE:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HIRED:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

function Stars({ rating }) {
  return (
    <span className="text-amber-400 font-mono tracking-tight text-xs">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default async function ApplicationDetailPage({ params }) {
  const { appId } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Fetch the full application with all related data in one Prisma query
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      candidate: true, // full candidate record
      job:       { select: { title: true, id: true } },
      currentStage: { select: { name: true, color: true } },
      scorecards: {
        include: {
          reviewer: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      auditLogs: {
        include: {
          actor:     { select: { name: true } },
          fromStage: { select: { name: true } },
          toStage:   { select: { name: true } },
        },
        // Oldest first so the timeline reads top-to-bottom chronologically
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!application) notFound()

  // Check if the current user already submitted a scorecard
  const alreadyReviewed = application.scorecards.some(
    (s) => s.reviewerId === session.user.id
  )

  // Check conflict of interest: reviewer referred this candidate
  const hasConflict = application.referrerId === session.user.id

  // Average rating across all scorecards
  const avgRating = application.scorecards.length > 0
    ? (application.scorecards.reduce((sum, s) => sum + s.rating, 0) / application.scorecards.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-black text-slate-200 antialiased px-6 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Back link */}
        <Link
          href={`/dashboard/jobs/${application.job.id}`}
          className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          &larr; Back to {application.job.title}
        </Link>

        {/* Candidate header */}
        <div className="mt-4 mb-8 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{application.candidate.name}</h1>
              <p className="text-sm text-slate-300 mt-1">{application.candidate.email}</p>
              {application.candidate.phone && (
                <p className="text-xs font-medium text-slate-400 mt-0.5">{application.candidate.phone}</p>
              )}
              {application.candidate.resumeUrl && (
                <a
                  href={application.candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mt-2.5 inline-flex items-center gap-1"
                >
                  View Candidate Resume <span className="text-[10px]">&nearr;</span>
                </a>
              )}
            </div>

            {/* Right-side status tracking and action console */}
            <div className="flex flex-col items-end gap-2.5 self-start sm:self-center">
              
              {/* Application status badge */}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${STATUS_STYLES[application.status]}`}>
                {application.status}
              </span>
              
              {/* Current stage badge */}
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white border border-black/20"
                style={{ backgroundColor: `${application.currentStage.color}1c`, color: application.currentStage.color, borderColor: `${application.currentStage.color}3d` }}
              >
                {application.currentStage.name}
              </span>

              {/* Average rating summary box */}
              {avgRating && (
                <div className="flex items-center gap-2 mt-0.5 bg-slate-950 border border-slate-800/60 px-2 py-1 rounded-lg shadow-sm">
                  <Stars rating={Math.round(Number(avgRating))} />
                  <span className="text-[10px] font-semibold tracking-wide text-slate-400 font-mono">
                    {avgRating} / 5.0
                  </span>
                </div>
              )}

              {/* ── NEW: Hire / Reject buttons — only for ADMIN and RECRUITER ── */}
              {['ADMIN', 'RECRUITER'].includes(session.user.role) && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 w-full flex justify-end">
                  <ApplicationStatusButtons
                    jobId={application.job.id}
                    appId={application.id}
                    currentStatus={application.status}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: Scorecard submission + existing scorecards ── */}
          <div className="space-y-6">

            {/* Scorecard form container */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-800 pb-2">Submit Scorecard</h2>

              {hasConflict ? (
                // Conflict of interest warning — cannot review
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-400 leading-relaxed">
                  ⚠️ Security Intercept: You are flagged as this candidate&apos;s referrer. Internal submission rules block this action to maintain scoring integrity.
                </div>
              ) : alreadyReviewed ? (
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs font-medium text-slate-400 leading-relaxed">
                  &amp;; Identity configuration verified. Your scorecard criteria for this candidate track has been saved to the database.
                </div>
              ) : (
                // ScorecardForm is a client component (needs state for selection breakdown)
                <ScorecardForm
                  jobId={application.job.id}
                  appId={application.id}
                  candidateName={application.candidate.name}
                />
              )}
            </div>

            {/* Existing scorecards list */}
            {application.scorecards.length > 0 && (
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-800 pb-2">
                  Evaluation Records ({application.scorecards.length})
                </h2>
                <div className="space-y-4">
                  {application.scorecards.map((sc) => (
                    <div key={sc.id} className="border-b border-slate-800/60 last:border-0 pb-3.5 last:pb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-200">{sc.reviewer.name}</span>
                        <Stars rating={sc.rating} />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 border border-slate-800/40 rounded-xl p-2.5 whitespace-pre-wrap">
                        {sc.feedback}
                      </p>
                      <p className="text-[10px] font-semibold font-mono text-slate-500 mt-2">
                        TIMESTAMP &rarr; {new Date(sc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Audit trail timeline ── */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5 border-b border-slate-800 pb-2">Activity Timeline</h2>
            <div className="relative pl-1">
              {/* Vertical line connecting timeline dots */}
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-800" />

              <div className="space-y-5">
                {application.auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 relative">
                    {/* Timeline dot element */}
                    <div className="w-6 h-6 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 z-10 mt-0.5">
                      <div className="w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                    </div>

                    <div className="flex-1 pb-1">
                      {/* Action label configurations */}
                      <p className="text-xs font-bold text-slate-200 leading-snug">
                        {log.action === 'APPLIED' && '📋 Application Ingested'}
                        {log.action === 'STAGE_MOVE' && (
                          <>
                            🔀 Workflow Shift:{' '}
                            <span className="text-slate-400 font-medium">{log.fromStage?.name}</span>
                            {' → '}
                            <span className="text-indigo-400 font-bold">{log.toStage?.name}</span>
                          </>
                        )}
                        {log.action === 'HIRED'    && '🎉 Funnel Clear: Candidate Hired'}
                        {log.action === 'REJECTED' && '❌ Application Archived'}
                      </p>

                      {/* Actor + timestamp metrics */}
                      <p className="text-[10px] font-medium text-slate-500 font-mono mt-1">
                        by {log.actor.name} &bull; {new Date(log.createdAt).toLocaleString()}
                      </p>

                      {/* Optional workflow log notes */}
                      {log.note && (
                        <p className="text-xs text-slate-400 mt-2 border-l border-indigo-500/30 pl-2.5 italic">
                          &ldquo;{log.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}