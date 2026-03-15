# Design Vault

Interior decorator product management app. Clip products from supplier websites, organize into client projects with rooms, generate branded PDFs (mood boards, invoices, spec sheets).

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + shadcn/ui + Tailwind CSS
- **Backend:** Hosted Supabase (Postgres + Auth + Storage)
- **Browser Extension:** Chrome Manifest V3 (Vite build)
- **PDF Generation:** Puppeteer (React templates → HTML → PDF)
- **Monorepo:** pnpm workspaces + Turborepo
- **Testing:** Playwright E2E (TDD)
- **CI/CD:** GitHub Actions (self-hosted runner)
- **Deployment:** Docker Compose on WSL2 + Cloudflare tunnel

## Project Structure

```
apps/web/          — Next.js web application
apps/extension/    — Chrome browser extension
packages/shared/   — Shared types (TypeScript) + validation schemas (Zod)
e2e/               — Playwright E2E tests
supabase/          — Database migrations and seed data
docker/            — Docker Compose configurations
.github/workflows/ — CI/CD pipelines
resources/         — Reference PDFs and logo (not deployed)
```

## Development

```bash
pnpm install                          # Install all dependencies
pnpm dev                              # Start Next.js dev server
pnpm build                            # Build all packages
pnpm lint                             # Lint all packages
pnpm typecheck                        # Type-check all packages
pnpm test:e2e                         # Run Playwright tests
```

## Key Conventions

- **TDD:** Write Playwright E2E tests before implementing features. Tests live in `e2e/tests/`.
- **Validation:** Use Zod schemas from `@design-vault/shared` for all form validation (web app and extension).
- **Types:** Import types from `@design-vault/shared`. Database types mirror the Supabase schema.
- **Supabase client:** Use `lib/supabase/server.ts` for server components/API routes, `lib/supabase/client.ts` for client components.
- **UI components:** Use shadcn/ui components in `apps/web/components/ui/`. Add new ones with `npx shadcn@latest add <component>`.
- **Styling:** Tailwind CSS. Use the `cn()` utility from `lib/utils.ts` for conditional classes.
- **API routes:** Next.js Route Handlers in `app/api/`. The extension communicates via `POST /api/extension/clip`.

## Database

- Hosted on supabase.com (two projects: test + prod)
- Migrations in `supabase/migrations/`
- `retail_price` is a generated column: `wholesale_price * (1 + markup_percent / 100)`
- RLS enabled: all tables allow authenticated users full access (single-user app)

## Business Rules

- **Wholesale prices are never shown on client-facing documents** (invoices show retail only, spec sheets show no prices)
- **Markup is per-product**, typically 50-60% but configurable
- **Products are reusable** across multiple projects via the room_products junction table
- **Tax rates** are configurable per state (CT, MA, CA, FL)
- **Invoice numbering** auto-increments

## Deployment

- **Production:** `designvault.wolvernite.com` — deploys on merge to main
- **Test:** `test.designvault.wolvernite.com` — deploys on PR creation
- Docker Compose with web + cloudflared services
- Environment files: `.env.prod` and `.env.test` (not committed)

## User Context

- **Deb** is the sole user — an interior decorator, not technical
- She uses Chrome on desktop and Android tablet
- The app should be intuitive with minimal technical jargon
- All generated PDFs are branded with her business: "Deborah Lynn Designs — Decorating Den Interiors"
