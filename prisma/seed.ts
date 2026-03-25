/**
 * SEED DATA POLICY GUARDRAIL
 *
 * This file must NOT contain fictional person names, sample data, or mock records.
 * All data displayed in the MassCEO Policy Tracker must come from real sources:
 *   - Manual entry by authorized staff
 *   - Automated ingestion (MA Legislature, Congress.gov, CSV/JSON import)
 *
 * If seed data is needed for development, use clearly synthetic labels
 * (e.g., "Test Bill #001") and ensure they are never deployed to production.
 * Never use realistic-sounding fictional names for people.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seed script is a no-op. All data comes from real sources or manual entry.')
  console.log('Use the admin sync or manual entry to populate data.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
