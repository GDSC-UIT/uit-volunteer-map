# UIT Volunteer Map

<!-- TODO: Add project description -->

## About

<!-- TODO: Describe what this app does -->

## Features

<!-- TODO: List main features -->

## Screenshots

<!-- TODO: Add screenshots -->

## Team

<!-- TODO: Add team members -->

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and development guide.
Use Node **24.22.3 LTS** and npm **11.19.1**, matching CI and `.nvmrc`.
Run backend and frontend in separate terminals with `npm run dev:backend` and
`npm run dev:frontend`; both build shared first. Environment examples live in
each package. Production requires explicit API origins and a private JWT secret.

See [database setup, opt-in demo and recovery](./packages/backend/MIGRATIONS.md#r11-reproducible-setup-demo-and-recovery)
for fresh migrations, synthetic Guest/Admin/Leader demo data, supported existing-database paths and backup/restore commands.
Run `npm run test:database` for the disposable migration/seed/recovery rehearsal.
