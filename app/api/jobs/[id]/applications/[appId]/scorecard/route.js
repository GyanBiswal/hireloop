// app/api/jobs/[id]/applications/[appId]/scorecard/route.js
//
// POST /api/jobs/[id]/applications/[appId]/scorecard
//
// Processes multi-field complex evaluation ratings for an application.
// Enforces Zod criteria range validation and business conflict-of-interest configurations.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Expanded Zod schema mapping to validate every distinct parameter
const detailedScorecardSchema = z.object({
  interviewType:    z.enum(['PHONE_SCREEN', 'TECHNICAL', 'FINAL_ROUND']),
  technicalAbility: z.number().int().min(1).max(5),
  communication:    z.number().int().min(1).max(5),
  problemSolving:   z.number().int().min(1).max(5),
  cultureFit:       z.number().int().min(1).max(5),
  strengths:        z.string().max(2000).optional(),
  concerns:         z.string().max(2000).optional(),
  recommendation:   z.enum(['STRONG_HIRE', 'HIRE', 'NO_HIRE', 'STRONG_NO_HIRE']),
})

export async function POST(request, context) {
  // Unpack dynamic route promises safely at execution entry
  const { id, appId } = await context.params
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'System Authentication Failure: Missing verified context.' }, { status: 401 })
  }

  const body = await request.json()
  const result = detailedScorecardSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Input parameters failed system verification schema matching.', fields: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Fetch target application to parse context structures
  const application = await prisma.application.findUnique({
    where: { id: appId },
  })

  if (!application) {
    return Response.json({ error: 'Target application record row not found.' }, { status: 404 })
  }

  // Business rule #4: Conflict of interest self-referral bypass protection
  if (application.referrerId === session.user.id) {
    return Response.json(
      { error: 'Security Exception: Scorecard generation blocked for candidate applications holding your referral index.' },
      { status: 403 }
    )
  }

  // Ensure unique one-scorecard constraint remains true per user per track row
  const existing = await prisma.scorecard.findFirst({
    where: {
      applicationId: appId,
      reviewerId:    session.user.id,
    },
  })

  if (existing) {
    return Response.json(
      { error: 'Constraint Drop: Evaluation mapping record matrix already logs data for your user ID.' },
      { status: 400 }
    )
  }

  // Calculate standard base rank average for legacy backwards-compatibility requirements
  const computedAverage = Math.round(
    (result.data.technicalAbility +
      result.data.communication +
      result.data.problemSolving +
      result.data.cultureFit) / 4
  )

  // Write new matrix block to database using a clean database transaction map
  const scorecard = await prisma.scorecard.create({
    data: {
      applicationId:    appId,
      reviewerId:       session.user.id,
      interviewType:    result.data.interviewType,    // Saved as an explicit Enum token
      recommendation:   result.data.recommendation,   // Saved as an explicit Enum token
      technicalAbility: result.data.technicalAbility,
      communication:    result.data.communication,
      problemSolving:   result.data.problemSolving,
      cultureFit:       result.data.cultureFit,
      rating:           computedAverage,              // Combined mean score
      strengths:        result.data.strengths || '',
      concerns:         result.data.concerns || '',
      feedback:         `[${result.data.interviewType}] Strengths: ${result.data.strengths || 'None'}. Concerns: ${result.data.concerns || 'None'}. Rec: ${result.data.recommendation}`, // Kept for legacy compatibility fallback
    },
  })

  return Response.json(scorecard, { status: 201 })
}