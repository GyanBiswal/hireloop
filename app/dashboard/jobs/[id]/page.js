// app/dashboard/jobs/[id]/page.js
//
// Job detail page — now renders the KanbanBoard instead of a flat table.
// Still a Server Component: fetches all data with Prisma, passes it as
// props to the KanbanBoard client component.
//
// This is the standard Next.js pattern: Server Component fetches data,
// Client Component handles interactivity. The data never goes through
// an extra API call — it's fetched once on the server and streamed as HTML.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import KanbanBoard from '@/app/components/KanbanBoard'
import CloseJobButton from '@/app/components/CloseJobButton'

const STATUS_STYLES = {
  OPEN:   'bg-green-100 text-green-700',
  DRAFT:  'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}

export default async function JobDetailPage({ params }) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) redirect('/login')

    if (!session) {
        redirect('/login')
    }   

    const job = await prisma.job.findUnique({
        where: { id },
        include: {
        pipelineStages: {
            orderBy: { order: 'asc' },
        },
        applications: {
            include: {
            candidate:    { select: { name: true, email: true } },
            currentStage: { select: { name: true, color: true } },
            // Include scorecards so the Kanban card can show avg rating
            scorecards:   { select: { rating: true } },
            },
            orderBy: { appliedAt: 'desc' },
        },
        },
    })

  if (!job) notFound()

  // CloseJob button — wired to the API via a small inline client component below
  const canClose = session.user.role === 'ADMIN' && job.status !== 'CLOSED'

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">

      {/* Back */}
      <Link href="/dashboard/jobs" className="text-sm text-indigo-600 hover:underline">
        ← Back to Jobs
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[job.status]}`}>
              {job.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">{job.department} · {job.location}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/${job.id}/apply`}
            target="_blank"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg
                       text-gray-600 hover:bg-gray-50 transition-colors"
          >
            View Apply Page ↗
          </Link>

          {/* Close Job — only for ADMIN, wired to API */}
          {canClose && <CloseJobButton jobId={job.id} />}
        </div>
      </div>

      {/* Kanban board */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Pipeline — {job.applications.length} candidate{job.applications.length !== 1 ? 's' : ''}
      </h2>

      {/* KanbanBoard is a Client Component — we pass serialisable props only
          (no Prisma model instances, just plain objects) */}
      <KanbanBoard
        stages={job.pipelineStages}
        initialApplications={job.applications}
        jobId={job.id}
        userRole={session.user.role}
      />

    </div>
  )
}
