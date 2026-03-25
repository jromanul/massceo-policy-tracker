# MassCEO Policy Tracker

Internal governance and policy monitoring tool for the Massachusetts Center for Employee Ownership (MassCEO) and Employee Ownership Advisory Board (EOAB).

## Features

- **Legislation Tracking** — Monitor MA and federal bills related to employee ownership
- **Budget Monitoring** — Track MassCEO-related budget items across fiscal years
- **Hearings & Calendar** — Manage hearing schedules, board meetings, and events
- **EOAB Policy Ideas** — Intake and track board-generated policy proposals
- **Knowledge Archive** — Preserve institutional memory and historical context
- **Role-Aware UI** — Staff Admin, Staff Editor, Board Member, Read Only roles
- **Governance Labels** — Clear distinction between staff analysis, board ideas, and formal actions

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite (via Prisma ORM) — zero-config, no Docker needed
- **Styling:** Tailwind CSS v4
- **Tables:** @tanstack/react-table
- **Calendar:** react-big-calendar
- **Icons:** lucide-react

## Prerequisites

- Node.js 20+

## Setup

1. **Install dependencies:**
   ```bash
   cd massceo-tracker
   npm install
   ```

2. **Create the database and apply schema:**
   ```bash
   npx prisma db push
   ```
   This creates `prisma/dev.db` (SQLite) automatically.

3. **Seed sample data:**
   ```bash
   npx tsx prisma/seed.ts
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

## Mock Authentication

The app uses a mock auth system for development. Set `MOCK_USER_ID` in `.env` to switch between users:

| ID | Name | Role |
|----|------|------|
| 1  | Sarah Chen | Staff Admin |
| 2  | Michael Rodriguez | Staff Editor |
| 3  | Janet Williams | Board Member |
| 4  | David Park | Read Only |
| 5  | Robert Kim | Board Member |
| 6  | Lisa Nguyen | Staff Editor |

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/
    ui/             # Base UI components (Button, Card, DataTable, etc.)
    layout/         # Navigation, page headers
    shared/         # Timeline, AttachmentPanel, GovernanceLabel
    dashboard/      # Dashboard-specific widgets
  lib/              # Core utilities, auth, constants, validators
  services/         # Business logic / data access layer
  ingestion/        # Live data ingestion layer
    adapters/       # Source-specific adapters (MA Legislature, Congress.gov, CSV/JSON)
    normalizers/    # Data normalization/mapping to canonical models
    orchestrator.ts # Sync coordination with upsert logic
    sync-log.ts     # Sync run recording and status queries
    types.ts        # Ingestion type definitions
    index.ts        # Public API
  types/            # Shared TypeScript types
prisma/
  schema.prisma     # Database schema
  seed.ts           # Seed data script
scripts/
  sync.ts           # CLI sync runner (cron-compatible)
```

## Ingestion Architecture

The `src/ingestion/` directory implements live data integration from external legislative sources.

### Source Adapters

| Adapter | Source | Data Types | API Key Required |
|---------|--------|-----------|-----------------|
| MA Legislature | malegislature.gov | Bills, Hearings | No |
| Congress.gov | api.congress.gov | Federal Bills | Yes |
| CSV Import | Local file | Bills | No |
| JSON Import | Local file | Bills | No |

### How Sync Works

1. **Fetch** — Source adapters retrieve raw data from external systems
2. **Normalize** — Normalizers map raw data to canonical internal models, preserving raw source status text
3. **Upsert** — Orchestrator creates or updates records by external source ID
4. **Log** — Every sync run is logged with counts and any errors

**Staff data protection:** Sync never overwrites staff-maintained fields (notes, priority, relevance, board interest, tags, attachments). Only source-derived fields (title, status, sponsor, committee, etc.) are refreshed.

### Manual Refresh

From the admin UI:
1. Go to **Admin > Sync** tab
2. Click **Run Sync** on the desired source, or **Sync All**
3. Use **Test Connection** to verify adapter connectivity

From the CLI:
```bash
npm run sync                    # Sync all sources
npm run sync ma_legislature     # Sync MA Legislature only
npm run sync congress_gov       # Sync Congress.gov only
npm run sync -- --hearings      # Sync hearings only
npm run sync -- --status        # Show sync status
```

### Scheduled Sync

The CLI script is cron-compatible:
```bash
# Every 6 hours
0 0,6,12,18 * * * cd /path/to/massceo-tracker && npx tsx scripts/sync.ts >> logs/sync.log 2>&1
```

### Congress.gov API Setup

1. Sign up at https://api.congress.gov/sign-up/
2. Set `CONGRESS_GOV_API_KEY` in `.env`

### Adding a New Source Adapter

1. Create a new adapter class in `src/ingestion/adapters/` implementing `SourceAdapter<T>`
2. Create a normalizer in `src/ingestion/normalizers/` implementing `Normalizer<TRaw, TCanonical>`
3. Register the adapter in `src/ingestion/adapters/index.ts` (ADAPTER_REGISTRY + factory functions)
4. Add the new DataSource enum value to `prisma/schema.prisma`
5. Add sync orchestration calls in `src/ingestion/orchestrator.ts`

### Imported vs Staff-Maintained Fields

**Source-derived (refreshed on sync):**
- title, billNumber, sessionNumber, chamber
- primarySponsor, coSponsors, assignedCommittee
- status, rawSourceStatus, statusDate
- externalLinks, sourceUrl

**Staff-maintained (never overwritten):**
- detailedNotes, priority, issueCategory
- relevanceToMassCEO, relevanceToEOAB
- boardInterestLevel, staffLeadId
- tags, documents, notes (relationships)
- preparationNotes, followUpNotes (hearings)

### Data Provenance

Every imported record stores:
- `dataSource` — which adapter created it (MA_LEGISLATURE, CONGRESS_GOV, etc.)
- `sourceUrl` — link back to the original source
- `sourceExternalId` — unique ID from the source system
- `lastSyncedAt` — when it was last refreshed
- `rawSourceStatus` — original status text from the source
- `rawSourceData` — full raw data snapshot (JSON)

Provenance is displayed on detail pages for imported records. List pages show a compact Source badge in each row, and the dashboard shows provenance on recently updated items.

### Source Hierarchy

Data sources are prioritized for display and sync conflict resolution:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 | MA_LEGISLATURE | Live API data from malegislature.gov |
| 2 | CONGRESS_GOV | Live API data from api.congress.gov |
| 3 | CSV_IMPORT / JSON_IMPORT | Bulk-imported data |
| 4 | MANUAL | Staff-entered data (default) |
| 5 | SEED | Sample/demo data |

### Budget Stage Tracking

Budget items track amounts at each legislative stage via the `BudgetStage` model:

| Stage | Description |
|-------|-------------|
| GOVERNOR | Governor's budget proposal |
| HOUSE | House Ways & Means version |
| SENATE | Senate Ways & Means version |
| CONFERENCE | Conference committee version |
| FINAL | Enacted budget |

Each stage records its own `amount`, `sourceUrl`, and optional `notes`. The budget detail page displays all stages with links to source documents on `budget.digital.mass.gov`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npx prisma db push` | Apply schema to SQLite |
| `npx tsx prisma/seed.ts` | Seed the database |
| `npx prisma db push --force-reset && npx tsx prisma/seed.ts` | Reset database and re-seed |
| `npx prisma studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |
| `npm run sync` | Run sync from CLI |

## Governance Labels

The app uses governance labels to clearly distinguish content origins:

- **Staff Analysis** — Analysis or recommendations from MassCEO staff
- **Monitoring Note** — Factual status updates and observations
- **Board Idea** — Policy ideas generated by EOAB members
- **Board Discussion Reference** — Notes from board discussions (not formal positions)
- **Formal Recommendation** — Official EOAB recommendations
- **Archived** — Historical reference material
