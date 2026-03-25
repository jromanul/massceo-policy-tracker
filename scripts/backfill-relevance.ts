#!/usr/bin/env tsx
/**
 * Backfill eoRelevanceScore for all existing LegislativeItem records.
 */

import { PrismaClient } from '@prisma/client'
import { computeRelevanceScore } from '../src/lib/relevance'

const prisma = new PrismaClient()

async function main() {
  const items = await prisma.legislativeItem.findMany({
    select: {
      id: true,
      title: true,
      shortSummary: true,
      issueCategory: true,
      eoRelevanceScore: true,
    },
  })

  console.log(`Found ${items.length} legislative items to score.`)

  let updated = 0
  let relevant = 0

  for (const item of items) {
    const score = computeRelevanceScore(item.title, item.shortSummary, item.issueCategory)
    if (score !== item.eoRelevanceScore) {
      await prisma.legislativeItem.update({
        where: { id: item.id },
        data: { eoRelevanceScore: score },
      })
      updated++
    }
    if (score >= 10) {
      relevant++
      console.log(`  [${score}] ${item.title.slice(0, 80)}`)
    }
  }

  console.log(`\nDone. Updated: ${updated}, EO-relevant (score >= 10): ${relevant}, Not relevant: ${items.length - relevant}`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
