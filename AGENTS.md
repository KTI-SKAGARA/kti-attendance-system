# AGENTS.md

KTI SKAGARA — Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 attendance & cash system for a student organization. No database; Google Sheets is the persistence layer.

## Commands

- `npm run dev` — dev server (Turbopack, port 3000)
- `npm run build` — production build (also typechecks)
- `npm run lint` — ESLint (Next core-web-vitals + TS configs)
- No test suite and no standalone typecheck script exist. To typecheck only: `npx tsc --noEmit`
- No CI, no pre-commit hooks, no task runner. `npm run build` + `npm run lint` are the full verification loop.

## Architecture

- Path alias: `@/*` → `src/*`.
- `src/lib/google-sheets.ts` is the single data-access module (fetch/append/delete + `autoSetupGoogleSheet`). All reads/writes happen through it; server actions in `src/app/actions/` call it.
- `src/app/actions/` — server actions returning the `ApiResponse<T> = { success, data?, error? }` shape (types in `src/types/attendance.ts`). Keep new actions in this convention.
- `src/middleware.ts` protects every route except `/login`, `/_next`, favicon: compares cookie `admin_session` against a hardcoded secret string. No auth library. `ADMIN_PASSWORD` env overrides the default login password `ktiskagara2026`.
- Angkatan is the string `"10" | "11" | "12"` (not X/XI/XII). Sheet tabs per angkatan: `GEN 10`, `GEN 11`, `GEN 12` (`SHEET_TAB_MAP` in `src/types/attendance.ts`).
- Tailwind v4, CSS-based config: theme tokens are defined via `@theme` in `src/app/globals.css`. There is NO `tailwind.config.*` file — don't create one.

## Google Sheets gotchas

- Sheet header row 1 must be: `Tanggal | Nama | Kelas | Status_Absen | Nominal_Kas | Bulan_Tahun`. README's old `Kelas_X/Xi/XII` tab naming is outdated — the code (`GEN 10/11/12`) wins, with fallbacks in `getSheet()`.
- Credentials resolution order: `service-account.json` in project root (gitignored, present locally) → env vars `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` + `GOOGLE_SPREADSHEET_ID`. `GOOGLE_PRIVATE_KEY` arrives quote-wrapped from Vercel; quotes are stripped and `\n` unescaped in `getFormattedPrivateKey()`.
- **Mock mode**: if no credentials are configured, the app silently uses an in-memory store (`MOCK_DATA` / `mockAppended`). Dev works with zero setup, but data lives only in the server process — don't assume Google Sheets failure if creds are absent; it's intended behavior.

## Conventions

- All UI text, error messages, and code comments are in Indonesian. Keep it that way.
- Student names are always UPPERCASE — converted on write (server action) and on read (`fetchRecords`). Don't skip this for new code paths.
- `Tanggal` (DD/MM/YYYY) and `Bulan_Tahun` (MM-YYYY) are generated server-side in `src/lib/utils.ts`; never accept them as client input.
- Status values: `Hadir | Sakit | Izin | Alfa` (`STATUS_ABSEN_OPTIONS`). Class names use official SKAGARA labels (`AKL 1`, `TKJ 2`, …) from `SKAGARA_CLASSES`.
- `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge) for conditional classes; `formatRupiah`/`formatBulanTahun` for display formatting.
- Sorting uses `localeCompare(..., "id")`.

## Environment

- Deploy target: Vercel (README documents env vars). `.env.local` exists locally and is gitignored, as is `service-account.json` — never commit or log credentials.
- Skills live in `.agents/skills/` — use them rather than guessing. UI/motion: prototype, improve-animations, review-animations, find-animation-opportunities, animation-vocabulary, apple-design, emil-design-eng, pick-ui-library, vercel-react-view-transitions. Code quality: vercel-react-best-practices (React/Next.js perf), web-design-guidelines (UI/UX/accessibility review), webapp-testing (Playwright verification — the project has no test suite), deploy-to-vercel. Sources: emilkowalski/skills, vercel-labs/agent-skills, ComposioHQ/awesome-claude-skills.
