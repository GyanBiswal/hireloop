// app/api/jobs/[id]/close/route.js
//
// PATCH /api/jobs/[id]/close
//
// Closes a job — sets status to CLOSED so no new applications are accepted.
// Business rule #3: only ADMIN can close jobs.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function PATCH(request, { params }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  // Only ADMIN can close jobs — RECRUITER cannot
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden — ADMIN only' }, { status: 403 })
  }

  const job = await prisma.job.findUnique({ where: { id: id } })
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 })

  if (job.status === 'CLOSED') {
    return Response.json({ error: 'Job is already closed' }, { status: 400 })
  }

  const updated = await prisma.job.update({
    where: { id: id },
    data:  { status: 'CLOSED' },
  })

  return Response.json(updated)
}