// lib/prisma.js
// Singleton Prisma client for the entire Next.js app.
// Prisma v7 requires passing a driver adapter — it no longer reads
// the connection URL from schema.prisma at runtime.

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function buildClient() {
  // PrismaPg is the official PostgreSQL adapter for Prisma v7.
  // Next.js automatically loads .env so DATABASE_URL is available here.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })
  return new PrismaClient({ adapter })
}

// Store on globalThis so Next.js hot-reloads in dev don't create
// a new DB connection on every file save.
const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma