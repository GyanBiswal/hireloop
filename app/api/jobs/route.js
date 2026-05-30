// app/api/jobs/route.js
//
// Handles two operations on the /api/jobs endpoint:
//   GET  /api/jobs → returns all jobs (used by the jobs list page)
//   POST /api/jobs → creates a new job + default pipeline stages
//
// Only ADMIN and RECRUITER can create jobs.
// GET is also protected — only authenticated users can list jobs.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Zod schema — defines the exact shape and rules for a valid job POST body.
// Zod throws a structured error if any field is missing or the wrong type.
// WHY Zod instead of manual if-checks:
//   It gives you one place to define all validation rules, auto-generates
//   error messages, and is easy to explain in interviews as "input validation layer".
const createJobSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  department:  z.string().min(1, 'Department is required'),
  description: z.string().min(1, 'Description is required'),
  location:    z.string().min(1, 'Location is required'),
  status:      z.enum(['DRAFT', 'OPEN'], { errorMap: () => ({ message: 'Status must be DRAFT or OPEN' }) }),
})

// Default pipeline stages every new job gets automatically.
// Defined once here so the API and seed stay in sync.
const DEFAULT_STAGES = [
  { name: 'Applied',             order: 1, color: '#6366f1' },
  { name: 'Phone Screen',        order: 2, color: '#f59e0b' },
  { name: 'Technical Interview', order: 3, color: '#3b82f6' },
  { name: 'Final Round',         order: 4, color: '#8b5cf6' },
  { name: 'Offer',               order: 5, color: '#10b981' },
]

// ── GET /api/jobs ─────────────────────────────────────────────────────────────
// No auth check here — the public apply page needs to fetch job info
// without the candidate being logged in.
// POST still requires ADMIN or RECRUITER (auth check stays there).
export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { name: true },
      },
      _count: {
        select: { applications: true },
      },
    },
  })

  return Response.json(jobs)
}

// ── POST /api/jobs ────────────────────────────────────────────────────────────
export async function POST(request) {
  // 1. Auth check
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'RECRUITER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Parse + validate body
  const body = await request.json()
  const result = createJobSchema.safeParse(body)
  // safeParse returns { success: true, data } or { success: false, error }
  // We use safeParse (not parse) so we can return a clean JSON error instead of throwing

  if (!result.success) {
    // result.error.flatten() turns Zod's nested error tree into a flat { fieldErrors } object
    // e.g. { fieldErrors: { title: ['Title is required'] } }
    return Response.json(
      { error: 'Validation failed', fields: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // 3. Create job + pipeline stages in a SINGLE TRANSACTION
  //
  // WHAT IS A PRISMA TRANSACTION?
  // A transaction wraps multiple DB operations so they either ALL succeed or ALL fail.
  // Without a transaction:
  //   - Job gets created ✅
  //   - Stage 1 gets created ✅
  //   - Stage 3 fails ❌  →  job exists but with incomplete pipeline — broken state
  // With a transaction:
  //   - If any operation fails, the entire thing is rolled back
  //   - The DB is NEVER left in a half-written state
  //
  // prisma.$transaction([...]) takes an array of Prisma promises and runs them atomically.

  const job = await prisma.$transaction(async (tx) => {
    // `tx` is a transaction-scoped Prisma client — use it for ALL operations inside
    const newJob = await tx.job.create({
      data: {
        title:       result.data.title,
        department:  result.data.department,
        description: result.data.description,
        location:    result.data.location,
        status:      result.data.status,
        createdById: session.user.id, // links job to the logged-in user
      },
    })

    // Create all 5 stages, each linked to the new job's ID
    await tx.pipelineStage.createMany({
      data: DEFAULT_STAGES.map((stage) => ({
        ...stage,
        jobId: newJob.id,
      })),
    })

    // Return the job from inside the transaction so the outer variable gets it
    return newJob
  })

  return Response.json(job, { status: 201 }) // 201 Created
}