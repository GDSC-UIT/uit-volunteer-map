# Database Migrations

The Start commands below are for new databases. For an existing populated file, first follow the [R11 supported upgrade and recovery policy](#r11-reproducible-setup-demo-and-recovery); do not assume the historical chain is safe on arbitrary data.

## Start

```bash
# From workspace root (recommended)
npm run migration:run
npm run seed

# Or directly in packages/backend (automatically builds shared prerequisite)
npm run migration:run
npm run seed

# Revert last migration
npm run migration:revert

# Generate new migration from entity changes
npm run migration:generate -- src/db/migrations/MigrationName

# Create empty migration
npm run migration:create -- src/db/migrations/MigrationName
```

## Workflow

### 1. Modify Entities
Update your entity files in `src/entities/`

### 2. Generate Migration
```bash
npm run migration:generate -- src/db/migrations/AddUserPhone
```

### 3. Review Generated Migration
Check the migration file in `src/db/migrations/` before running

### 4. Run Migration
```bash
npm run migration:run
```

### 5. Rollback (if needed)
```bash
npm run migration:revert
```

## Best Practices

- Always review generated migrations before running
- Test migrations in development first
- Never modify migrations that have been deployed
- Use descriptive migration names
- Commit migrations with related entity changes

## Database Location

Default path (development, migrations, seeds, and compiled runtime): `src/data/database.sqlite` (relative to `packages/backend`).

Override the database location explicitly with `DB_PATH` (accepts a path relative to `packages/backend`, an absolute file path, or `:memory:`):

```bash
# From workspace root, prepare artifacts once:
npm run build:backend
# Compiled-only commands consume dist; they do not rebuild or require TS source.
DB_PATH=./src/data/database.sqlite npm run migration:run:dist -w @uit-volunteer-map/backend
DB_PATH=./src/data/database.sqlite npm run seed:dist -w @uit-volunteer-map/backend
```

On PowerShell, set `$env:DB_PATH = '<path>'` before these commands instead of using
the Bash environment-variable prefix. `DB_PATH` takes precedence over the
`DATABASE_PATH` compatibility alias. Source commands build shared first; compiled
commands require prepared backend/shared `dist` directories and installed runtime
dependencies. Use `npm run test:smoke` for a fresh disposable migration/start/health
check that leaves existing databases untouched.
## R11: reproducible setup, demo and recovery

These commands were validated on Windows, Node 24.11.1 and the locked SQLite driver. Keep `synchronize: false`. New/empty databases apply **15 migrations**. Existing populated databases must use the guarded workflow below; a successful empty bootstrap does not prove every historical upgrade.

### Opt-in demo

Default `npm run seed` only ensures Admin/Leader roles by **name**, without changing role IDs or resetting accounts. Historical bootstrap migrations still insert their legacy `admin`, `leader`, `leader2` accounts/profiles; those migrations were not rewritten. Their credential/provisioning policy must be reviewed before exposing a fresh production instance.

For a disposable demo, choose an explicit, unused database path, migrate it, then opt in:

```powershell
npm run build
$env:DB_PATH = 'D:\PrivateDemo\uit-demo.sqlite'
npm run migration:run:dist -w @uit-volunteer-map/backend
$env:DEMO_ADMIN_PASSWORD = Read-Host 'Demo admin password (12+ characters)' -MaskInput
$env:DEMO_LEADER_PASSWORD = Read-Host 'Demo leader password (12+ characters)' -MaskInput
npm run seed:dist -w @uit-volunteer-map/backend -- --demo
Remove-Item Env:DEMO_ADMIN_PASSWORD, Env:DEMO_LEADER_PASSWORD
```

Create the private parent folder first. PowerShell's `-MaskInput` requires PowerShell 7. The demo is refused when NODE_ENV=production, DB_PATH/DATABASE_PATH is omitted, either password is shorter than 12 characters or exceeds bcrypt's 72 UTF-8 bytes, or existing application/non-bootstrap identity data is detected. There is no built-in demo password.

The synthetic `demo-admin` and `demo-leader` accounts have separate User profiles. The Leader is assigned to one clearly marked campaign/team with two posts, illustrative coordinates and existing packaged `/Homepage_Logo.svg` artwork. This is sample content, not evidence of real volunteer activity. No external uploads are required.

Rerunning a complete demo seed does not reset changed passwords, reactivate accounts or overwrite content. Conflicting/incomplete demo names cause refusal, not repair. Demo creation is transactional, including its media and assignment. Default roles and demo seeding are separately exercised twice by `npm run test:database`.

### Supported upgrade policy

| Observed/known baseline | Supported operation |
|---|---|
| New empty DB | Normal full migration chain + default seed; optional explicit demo. |
| Exact known migration prefix of 12, 13, 14 or 15 entries | Guarded forward upgrade with a **new** verified backup. A populated 12→15 rehearsal preserves IDs, relationships, hashes, content and timestamps; repeated upgrade applies zero. |
| Exact first three migrations with populated Post rows | Normal migration 4 fails with `temporary_Post.CreatedAt`. Use reviewed export/transform/import into a **new** DB as below. |
| Other/unknown histories, manual schema variants, FK violations | Refuse automatic upgrade. Inventory and rehearse a separate reviewed recovery; do not fake migration entries or reset the source. |

One local developer DB was inspected with SQLite OPEN_READONLY: its ledger has 12 migrations and its hash stayed unchanged. This supports the local baseline observation only. **No deployed DB was accessed**. Before production use, the operator must inventory the actual deployed ledger/schema, confirm which tested path applies and rehearse against its verified backup. Unsupported historical versions are not declared safe by exclusion.

`1795104000000-NormalizeCoordinateCheck` moves the R06 inline coordinate CHECK into a table-level CHECK that TypeORM can read. The old check already enforced the same bounds; the new representation removes a false schema diff without changing coordinates. It preserves Post/Photo links under the normal migration runner. Its down is intentionally representation-preserving: it keeps the check/data; reapplying is harmless. Full version rollback uses a verified backup, not blind repeated migration reverts.

### Guarded database tool

Prepare current artifacts with `npm run build:backend`. The tool is compiled JS and requires explicit paths; use absolute paths to avoid cwd ambiguity. It never defaults to the development DB.

```powershell
# Read-only metadata: migration names, integrity/FK checks and table counts, no passwords.
npm run db:tool -w @uit-volunteer-map/backend -- inspect --source 'D:\PrivateData\uit.sqlite'

# Independent snapshot. Target must not already exist.
npm run db:tool -w @uit-volunteer-map/backend -- backup --source 'D:\PrivateData\uit.sqlite' --target 'D:\PrivateBackup\uit-inventory.sqlite'

# Stop application writers first. This creates its own NEW backup before migration.
npm run db:tool -w @uit-volunteer-map/backend -- upgrade --source 'D:\PrivateData\uit.sqlite' --backup 'D:\PrivateBackup\uit-before-upgrade.sqlite'

# Restore into a NEW candidate, preserving the current file for investigation.
npm run db:tool -w @uit-volunteer-map/backend -- restore --source 'D:\PrivateBackup\uit-before-upgrade.sqlite' --target 'D:\PrivateData\uit-restored-candidate.sqlite'
```

The SQLite backup API captures committed WAL data; it is not a raw filesystem copy that omits `-wal`. Backup/restore verifies integrity and returns a checksum/counts. Existing targets are refused. Create the target parent directory first. The tool does not replace the live DB or switch DB_PATH; verify the restored candidate with the matching application version before a separately controlled cutover. A source with FK violations or unknown migration history is refused for direct upgrade.

Run upgrade/recovery with writers stopped, from verified backups, in a private directory. If any step fails, do not serve the candidate: preserve the files and inspect/rehearse restoration. Backup/archive data contains personal records and password hashes; keep it access-controlled and out of Git. The tool's restrictive creation mode is not a substitute for Windows directory ACLs.

### Historical first-three-migration recovery

Historical Post.CampaignId denotes a campaign, not a team. The later historical rename is insufficient evidence to assign ownership. Provide one explicit PostId→TeamId mapping for every post, with the team belonging to the original campaign, plus an explicit fallback timestamp for the missing CreatedAt/UpdatedAt values.

Example `recovery-plan.json` for a synthetic Post 700, Campaign 7, Team 70:

```json
{
  "fallbackTimestamp": "2026-01-01T00:00:00.000Z",
  "postTeams": { "700": 70 }
}
```

Choose the timestamp/mapping from reviewed records; the example date is not inferred historical evidence.

```powershell
npm run db:tool -w @uit-volunteer-map/backend -- backup --source 'D:\PrivateData\legacy.sqlite' --target 'D:\PrivateBackup\legacy-before-recovery.sqlite'
npm run db:tool -w @uit-volunteer-map/backend -- recover --source 'D:\PrivateBackup\legacy-before-recovery.sqlite' --target 'D:\PrivateData\recovered-candidate.sqlite' --mapping 'D:\PrivateData\recovery-plan.json'
npm run db:tool -w @uit-volunteer-map/backend -- inspect --source 'D:\PrivateData\recovered-candidate.sqlite'
```

Recovery reads the source only, exports its original rows to `recovered-candidate.sqlite.legacy.json`, migrates a new target normally, replaces only that fresh target's bootstrap rows and imports the reviewed transformation transactionally. Account IDs/password hashes, User/Team/Campaign/Post/Photo IDs, author/team membership, content and URLs are preserved. Old Status/Campaign.UserId and the original Post.CampaignId remain in the archive. Missing timestamps use the explicitly provided value, old posts remain unlocated, and photos receive stable ID order and one first image. No commander, coordinates or ownership are guessed. The source is never rewritten or automatically replaced.

The recovery path accepts only the tested first-three ledger/schema generation. Null/missing/foreign-campaign mappings, incomplete plans and existing output/archive files are refused. Manual schema variants and other versions need a separate reviewed plan. A failed target is not a live DB: retain it privately for diagnosis and retry with a new output path.

### Verification

`npm run test:database` builds current shared/backend and runs a disposable acceptance rehearsal: all 15 migrations/restart, default and opt-in seed twice, credential/own-team/post checks, zero FK/schema drift, overwrite refusal, WAL backup, restore, populated 12→15 upgrade/repeat, unknown-history refusal, reproduced historical timestamp failure, reviewed recovery and original-schema restoration. All temporary files are scoped/cleaned and the developer DB hash is checked before/after.

`npm run test:smoke` additionally verifies compiled migration/seed/server startup and HTTP health. Run normal tests/lint/build after substantive changes. Detailed executed evidence and screenshots: [R11 handoff](../../docs/handoffs/R11.md).
