# Data Source Architecture

Complete reference for the MassCEO Policy Tracker's data source model, ingestion pipeline, and provenance tracking.

---

## Source Map by Section

| Section | Source | Classification | Adapter Status |
|---------|--------|---------------|----------------|
| **Legislation** | MA Legislature (malegislature.gov) | Authoritative External | Live |
| | Congress.gov API | Authoritative External | Live (requires API key) |
| | CSV Import | Non-authoritative Import | Live |
| | JSON Import | Non-authoritative Import | Live |
| | Manual Entry | Internal | Live |
| **Budget** | MA Budget (budget.digital.mass.gov) | Authoritative External | **Stub — not yet implemented** |
| | Seed Script (seed-budget.ts) | Sample/Demo | Live |
| | CSV/JSON Import | Non-authoritative Import | Live (via budget normalizer) |
| | Manual Entry | Internal | Live |
| **Hearings** | MA Legislature Events | Authoritative External | Live |
| | Seed Script (seed-hearings.ts) | Sample/Demo | Live (fallback) |
| | Manual Entry | Internal | Live |
| **Policy Ideas** | Manual Entry | Internal (by design) | Live |
| **Amendments/Earmarks** | Manual Entry | Internal | Live |
| **Knowledge Base** | Manual Entry | Internal (by design) | Live |

---

## Source Priority Hierarchy

When multiple sources provide data for the same record, priority determines which source wins:

| Priority | DataSource | Classification |
|----------|-----------|----------------|
| 1 (highest) | `MA_LEGISLATURE` | Authoritative External |
| 2 | `CONGRESS_GOV` | Authoritative External |
| 3 | `CSV_IMPORT`, `JSON_IMPORT` | Non-authoritative Import |
| 4 | `MANUAL` | Internal |
| 5 (lowest) | `SEED` | Sample/Demo |

**Rules:**
- Authoritative external sources override demo data
- Internal annotations (notes, priority, relevance, board interest) are never overwritten by sync
- Sample/demo data is never shown as authoritative — it has a distinct content class
- Manual records can coexist with imported records and are clearly labeled by `dataSource`

---

## Content Classification

Every record is classified into one of three content classes, derived from its `dataSource` field:

| Content Class | DataSources | UI Label | Description |
|---------------|-------------|----------|-------------|
| `authoritative_external` | MA_LEGISLATURE, CONGRESS_GOV | Authoritative | From official government sources |
| `internal_manual` | MANUAL, CSV_IMPORT, JSON_IMPORT | Internal | Staff-entered or imported data |
| `sample_demo` | SEED | Sample/Demo | Demonstration data only |

See `src/lib/source-metadata.ts` for derivation functions.

---

## Provenance Fields by Model

All six core models now have consistent provenance tracking:

| Field | LegislativeItem | BudgetItem | Hearing | PolicyIdea | Amendment | KnowledgeEntry |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|
| `dataSource` | Y | Y | Y | Y | Y | — |
| `sourceUrl` | Y | Y | Y | — | Y | — |
| `sourceExternalId` | Y | Y | Y | — | Y | — |
| `lastSyncedAt` | Y | Y | Y | — | Y | — |
| `sourceRetrievedAt` | Y | Y | Y | — | Y | — |
| `rawSourceData` | Y | Y | Y | — | Y | — |
| `rawSourceStatus` | Y | Y | Y | — | Y | — |
| `createdBy` (User) | — | — | — | Y (submittedBy) | — | Y |

**Note:** PolicyIdea and KnowledgeEntry are internal-only by design and don't need external source tracking fields. They track authorship instead.

---

## Source-Derived vs Staff-Maintained Fields

During sync, the orchestrator protects staff-maintained fields from being overwritten.

### Source-Derived Fields (updated by sync)
- title, billNumber, sessionNumber, chamber
- primarySponsor, coSponsors, assignedCommittee
- status, rawSourceStatus, statusDate
- externalLinks, sourceUrl, rawSourceData, lastSyncedAt

### Staff-Maintained Fields (never overwritten)
- detailedNotes, relevanceToMassCEO, relevanceToEOAB
- priority, boardInterestLevel, boardDiscussionStatus
- staffLeadId, issueCategory
- tags, documents, notes, history entries
- trackingTier (staff workflow field)

See `src/ingestion/orchestrator.ts` — `SOURCE_DERIVED_LEGISLATION_FIELDS` and `SOURCE_DERIVED_HEARING_FIELDS`.

---

## Tracking Tiers (Legislation)

Legislation items have a `trackingTier` field that controls the curation workflow:

| Tier | Meaning | When set |
|------|---------|----------|
| `IMPORTED` | Raw import, not yet reviewed | Default for all synced records |
| `REVIEWED` | Staff has reviewed for relevance | Staff marks after initial review |
| `ACTIVELY_TRACKED` | Being actively monitored by MassCEO | Staff promotes relevant items |
| `ARCHIVED_NOT_RELEVANT` | Reviewed and determined not relevant | Staff demotes irrelevant imports |

This prevents irrelevant imported federal bills from flooding the UI — staff can filter by tracking tier.

---

## Adapter Status

| Adapter | Entity | Source | Status |
|---------|--------|--------|--------|
| `MALegislatureAdapter` | Legislation | malegislature.gov | Live |
| `MALegislatureHearingAdapter` | Hearings | malegislature.gov/Events | Live |
| `CongressGovAdapter` | Legislation | Congress.gov API v3 | Live (requires `CONGRESS_GOV_API_KEY`) |
| `CSVImportAdapter` | Legislation, Budget | User-uploaded CSV | Live |
| `JSONImportAdapter` | Legislation, Budget | User-uploaded JSON | Live |
| `MABudgetAdapter` | Budget | budget.digital.mass.gov | **Stub — not yet implemented** |

### Planned integrations
- **MA Budget scraper**: Target budget.digital.mass.gov for Governor/House/Senate/Conference budget stages
- **Committee-level hearing pages**: Individual committee hearing schedules on malegislature.gov

---

## Completeness Assessment

### Sections with authoritative external sourcing
- **Legislation** — MA Legislature + Congress.gov (live)
- **Hearings** — MA Legislature Events (live)

### Sections with no authoritative external sourcing (yet)
- **Budget** — Stub adapter exists; currently relies on seed data + manual entry
- **Amendments/Earmarks** — Manual-only; provenance fields ready for future import
- **Policy Ideas** — Internal-only by design
- **Knowledge Base** — Internal-only by design

### Sections still relying on sample/demo data
- **Budget** — 6 seeded FY2027 items (marked `dataSource: SEED`)
- **Hearings** — 5 fallback hearings if MA Legislature sync returns 0 results

### Key remaining gaps
1. No live budget data ingestion (MA Budget adapter is a stub)
2. No amendment import pipeline (provenance infrastructure is in place)
3. Bill action extraction depends on raw source data format from adapters
4. Committee-level hearing scraping not implemented

---

## Sync Infrastructure

### CLI Commands
```bash
tsx scripts/sync.ts                    # Sync all active sources
tsx scripts/sync.ts ma_legislature     # Sync specific source
tsx scripts/sync.ts --hearings         # Sync hearings only
tsx scripts/sync.ts --status           # Show sync status
```

### Cron Setup
```cron
# Example: sync every 6 hours
0 0,6,12,18 * * * cd /path/to/massceo-tracker && tsx scripts/sync.ts
```

### Sync Behavior
1. **Fetch** raw records from adapter
2. **Normalize** to canonical format
3. **Upsert** using sourceExternalId or (jurisdiction + billNumber + sessionNumber) as keys
4. **Protect** staff-maintained fields — only source-derived fields are updated
5. **Detect changes** — skip update if nothing actually changed (just touch lastSyncedAt)
6. **Record history** — create HistoryEntry for sync_update and sync_linked actions
7. **Log results** — persist SyncResult to SyncLog table
8. **Extract bill actions** — upsert BillAction records from rawSourceData
