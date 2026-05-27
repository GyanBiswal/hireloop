// prisma/seed.js
// Seeds the database with test users and sample jobs.
// Run with: npx prisma db seed

// Load .env variables before anything else —
// plain Node.js scripts don't load .env automatically (only Next.js does)
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

// Prisma v7 requires an explicit driver adapter instead of reading the URL
// from schema.prisma. PrismaPg is the official PostgreSQL adapter.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

const STAGE_TEMPLATES = [
  { name: 'Applied',             order: 1, color: '#6366f1' },
  { name: 'Phone Screen',        order: 2, color: '#f59e0b' },
  { name: 'Technical Interview', order: 3, color: '#3b82f6' },
  { name: 'Final Round',         order: 4, color: '#8b5cf6' },
  { name: 'Offer',               order: 5, color: '#10b981' },
]

async function main() {
  console.log('🌱 Seeding database...')

  const adminHash       = await bcrypt.hash('admin123',       10)
  const recruiterHash   = await bcrypt.hash('recruiter123',   10)
  const interviewerHash = await bcrypt.hash('interviewer123', 10)

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@hireloop.com' },
    update: {},
    create: { name: 'Alice Admin', email: 'admin@hireloop.com', password: adminHash, role: 'ADMIN' },
  })

  const recruiter = await prisma.user.upsert({
    where:  { email: 'recruiter@hireloop.com' },
    update: {},
    create: { name: 'Bob Recruiter', email: 'recruiter@hireloop.com', password: recruiterHash, role: 'RECRUITER' },
  })

  await prisma.user.upsert({
    where:  { email: 'interviewer@hireloop.com' },
    update: {},
    create: { name: 'Carol Interviewer', email: 'interviewer@hireloop.com', password: interviewerHash, role: 'INTERVIEWER' },
  })

  console.log('✅ Users created')

  const jobsData = [
    {
      title: 'Senior Frontend Engineer', department: 'Engineering',
      description: 'Build and maintain our React-based dashboard. Deep knowledge of Next.js required.',
      location: 'Remote', status: 'OPEN', createdById: recruiter.id,
    },
    {
      title: 'Product Manager', department: 'Product',
      description: 'Own the roadmap for our core ATS product. Work cross-functionally with eng and design.',
      location: 'New York, NY', status: 'OPEN', createdById: admin.id,
    },
  ]

  for (const jobData of jobsData) {
    const existing = await prisma.job.findFirst({ where: { title: jobData.title } })
    if (existing) {
      console.log(`⏭️  Job "${jobData.title}" already exists, skipping`)
      continue
    }
    await prisma.job.create({
      data: {
        ...jobData,
        pipelineStages: { create: STAGE_TEMPLATES },
      },
    })
    console.log(`✅ Job created: ${jobData.title}`)
  }

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })