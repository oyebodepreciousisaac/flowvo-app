# Settlevo (Flowvo) — Application Package

This directory contains the Next.js 16 App Router application for Settlevo.

For comprehensive documentation, architecture diagrams, and system specifications, see the root [README.md](../README.md) and the [`docs/`](../docs/) directory.

---

## Available Scripts

In this directory, you can run:

- `npm run dev`: Runs the local development server at `http://localhost:3000`.
- `npm run build`: Compiles and builds the production application with Next.js Turbopack.
- `npm start`: Runs the built production application.
- `npm test`: Executes all 74 automated tests with Vitest.
- `npm run test:watch`: Runs Vitest in interactive watch mode.
- `npm run lint`: Runs ESLint for static code analysis.
- `npm run db:generate`: Generates the Prisma client.
- `npm run db:migrate`: Applies Prisma migrations locally.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router + React 19 Server Components)
- **Styling**: Tailwind CSS v4
- **ORM & Database**: Prisma ORM with PostgreSQL / Neon
- **Testing**: Vitest with `@vitest/coverage-v8`
