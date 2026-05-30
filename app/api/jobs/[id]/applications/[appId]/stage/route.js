// app/api/jobs/[id]/applications/[appId]/stage/route.js
//
// PATCH /api/jobs/[id]/applications/[appId]/stage
//
// Moves a candidate from their current pipeline stage to a new one.
// This is the most business-critical API in HireLoop — it enforces:
//   1. Auth: only ADMIN or RECRUITER can move candidates
//   2. Validity: the new stage must belong to THIS job (prevent cross-job moves)
//   3. Atomicity: Application update + AuditLog write happen in ONE transaction
//
// Business rule #5: every stage transition writes an AuditLog row.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { sendStageMovedEmail } from '@/lib/email'

const moveStageSchema = z.object({
  // The ID of the stage we're moving TO
  newStageId: z.string().min(1, 'newStageId is required'),
  // Optional recruiter note recorded in the audit log
  note: z.string().optional(),
})

export async function PATCH(request, context) {
  const { id, appId } = await context.params
  // 1. Auth + role check
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'RECRUITER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Validate body
  const body = await request.json()
  const result = moveStageSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', fields: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { newStageId, note } = result.data

  // 3. Load the application with its current stage and job
  const application = await prisma.application.findUnique({
    where: { id: appId },
    include: { currentStage: true },
  })

  if (!application) {
    return Response.json({ error: 'Application not found' }, { status: 404 })
  }

  // 4. Verify the target stage belongs to this job — prevents moving a candidate
  //    to a stage from a completely different job (a data integrity bug)
  const targetStage = await prisma.pipelineStage.findFirst({
    where: {
      id:    newStageId,
      jobId: id, // must belong to the job in the URL
    },
  })

  if (!targetStage) {
    return Response.json(
      { error: 'Stage not found or does not belong to this job' },
      { status: 400 }
    )
  }

  // 5. Don't allow moving to the same stage (no-op with side effects)
  if (application.currentStageId === newStageId) {
    return Response.json({ error: 'Candidate is already in this stage' }, { status: 400 })
  }

  // 6. Perform the move in a TRANSACTION
  //    WHY: if the AuditLog write fails after the Application update,
  //    we'd have a move with no paper trail — a compliance problem.
  //    The transaction rolls BOTH back if either fails.
  const updated = await prisma.$transaction(async (tx) => {
    // Update the application's current stage
    const updatedApp = await tx.application.update({
      where: { id: appId },
      data:  { currentStageId: newStageId },
      // updatedAt is automatically set by Prisma's @updatedAt field
    })

    // Write the audit log entry — permanent record of this move
    await tx.auditLog.create({
      data: {
        applicationId: appId,
        actorId:       session.user.id,         // who performed the move
        fromStageId:   application.currentStageId, // where they came FROM
        toStageId:     newStageId,                 // where they went TO
        action:        'STAGE_MOVE',
        note:          note || null,
      },
    })

    const appWithCandidate = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        candidate: { select: { name: true, email: true } },
        job:       { select: { title: true } },
      },
    })

    sendStageMovedEmail({
      candidateName:  appWithCandidate.candidate.name,
      candidateEmail: appWithCandidate.candidate.email,
      jobTitle:       appWithCandidate.job.title,
      stageName:      targetStage.name,
    })
    // NOTE: no await — intentional. See lib/email.js for why.

    return updatedApp
  })

  return Response.json(updated)
}