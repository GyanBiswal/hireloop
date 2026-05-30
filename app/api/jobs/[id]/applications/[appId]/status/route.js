// app/api/jobs/[id]/applications/[appId]/status/route.js
//
// PATCH /api/jobs/[id]/applications/[appId]/status
//
// Sets an application's final status to HIRED or REJECTED.
// Only ADMIN and RECRUITER can do this.
// Writes an AuditLog entry in the same transaction — business rule #5.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { sendHiredEmail } from '@/lib/email'

const statusSchema = z.object({
  // Only these two are valid final statuses — ACTIVE is the default, set at apply time
  status: z.enum(['HIRED', 'REJECTED']),
  note:   z.string().optional(),
})

export async function PATCH(request, context) {
  const { id, appId } = await context.params
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'RECRUITER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const result = statusSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', fields: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const application = await prisma.application.findUnique({
    where: { id: appId },
  })

  if (!application) {
    return Response.json({ error: 'Application not found' }, { status: 404 })
  }

  // Prevent double-finalising — once HIRED or REJECTED, status is locked
  if (application.status !== 'ACTIVE') {
    return Response.json(
      { error: `Application is already ${application.status}` },
      { status: 400 }
    )
  }

  // Update status + write AuditLog in one transaction
  const updated = await prisma.$transaction(async (tx) => {
    const updatedApp = await tx.application.update({
      where: { id: appId },
      data:  { status: result.data.status },
    })

    await tx.auditLog.create({
      data: {
        applicationId: appId,
        actorId:       session.user.id,
        fromStageId:   null, // status change is not a stage move
        toStageId:     null,
        action:        result.data.status, // "HIRED" or "REJECTED"
        note:          result.data.note || null,
      },
    })

    if (result.data.status === 'HIRED') {
        const appWithCandidate = await prisma.application.findUnique({
            where: { id: appId },
            include: {
            candidate: { select: { name: true, email: true } },
            job:       { select: { title: true } },
            },
        })
        sendHiredEmail({
            candidateName:  appWithCandidate.candidate.name,
            candidateEmail: appWithCandidate.candidate.email,
            jobTitle:       appWithCandidate.job.title,
        })
    }

    return updatedApp
  })

  return Response.json(updated)
}