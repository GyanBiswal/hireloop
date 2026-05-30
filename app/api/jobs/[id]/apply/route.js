// app/api/jobs/[id]/apply/route.js
//
// PUBLIC endpoint — no authentication required.
// Accepts a job application from a candidate (anyone on the internet).
// Creates or finds the Candidate record, then creates an Application
// at the first pipeline stage, and writes an AuditLog entry.

import prisma from '@/lib/prisma'
import { z } from 'zod'
import { sendApplicationReceivedEmail } from '@/lib/email'

// Zod validation for the apply form submission
const applySchema = z.object({
  name:      z.string().min(1, 'Full name is required'),
  email:     z.string().email('Please enter a valid email'),
  phone:     z.string().min(1, 'Phone number is required'),
  resumeUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

export async function POST(req, context) {
  const params = await context.params

  try {
    // 1. Validate body
    const body = await req.json()

    const result = applySchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fields: result.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      )
    }

    const { name, email, phone, resumeUrl } = result.data

    // 2. Verify the job exists and is OPEN
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        // Fetch stages ordered so we can reliably get the FIRST stage (order: 1)
        pipelineStages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!job) {
      return Response.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'OPEN') {
      return Response.json(
        { error: 'This job is not accepting applications' },
        { status: 400 }
      )
    }

    if (job.pipelineStages.length === 0) {
      return Response.json(
        { error: 'Job has no pipeline stages' },
        { status: 500 }
      )
    }

    const firstStage = job.pipelineStages[0]

    // 3. Transaction
    const application = await prisma.$transaction(async (tx) => {

      // Upsert candidate
      const candidate = await tx.candidate.upsert({
        where: { email },

        update: {
          name,
          phone,
        },

        create: {
          name,
          email,
          phone,
          resumeUrl: resumeUrl || null,
        },
      })

      // Prevent duplicate applications
      const existing = await tx.application.findFirst({
        where: {
          candidateId: candidate.id,
          jobId: job.id,
        },
      })

      if (existing) {
        throw new Error('DUPLICATE_APPLICATION')
      }

      // Create application
      const newApplication = await tx.application.create({
        data: {
          candidateId: candidate.id,
          jobId: job.id,
          currentStageId: firstStage.id,
          status: 'ACTIVE',
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          applicationId: newApplication.id,
          actorId: job.createdById,
          fromStageId: null,
          toStageId: firstStage.id,
          action: 'APPLIED',
          note: `${name} submitted an application`,
        },
      })

      return newApplication
    })

    sendApplicationReceivedEmail({
      candidateName:  name,
      // Use your own email while testing — free tier only delivers to verified addresses
      candidateEmail: process.env.NODE_ENV === 'production' ? email : process.env.TEST_EMAIL,
      jobTitle:       job.title,
    })

    return Response.json(
      {
        success: true,
        applicationId: application.id,
      },
      {
        status: 201,
      }
    )

  } catch (error) {
    console.error(error)

    // Friendly duplicate application error
    if (error.message === 'DUPLICATE_APPLICATION') {
      return Response.json(
        {
          error: 'You have already applied for this job.',
        },
        {
          status: 409,
        }
      )
    }

    return Response.json(
      {
        error: 'Something went wrong.',
      },
      {
        status: 500,
      }
    )
  }
}