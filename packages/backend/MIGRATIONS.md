# Database Migrations

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
