# Monorepo Overview — Three Systems

This repository contains three independent projects built as part of a software engineering assessment. Each demonstrates different architectural patterns, tech stacks, and problem domains.

```
a4/
├── a4/                              ─── System 1: Abstract Screening Harness
├── evd/                             ─── System 2: Evidence Gap Map
├── b1-document_ingestion_endpoint/  ─── System 3: Document Ingestion API
├── SYSTEMS.md                       ← This file
└── README.md                        ── System 1 README
```

---

## System 1: Abstract Screening Evaluation Harness (`a4/`)

**What it does:** A test harness for evaluating AI-based abstract screening in systematic reviews. Provides a ground-truth dataset of 20 abstracts with known include/exclude decisions, a pluggable screener interface (mock, Mistral, OpenAI), metrics computation (precision, recall, F1, confusion matrix), a CLI runner, and a browser-based test page.

**Stack:** React 19 + Vite 8, `node:test` (zero-dependency test runner), no database.

**Key files:**
- `src/screening/dataset.js` — 20 realistic abstracts about exercise therapy for chronic low back pain
- `src/screening/evaluate.js` — Pure functions for metrics computation
- `src/screening/screener.js` — Factory functions for mock, OpenAI, and Mistral screeners
- `src/screening/run.js` — CLI entry point for running evaluations
- `src/screening/TestPage.jsx` — Interactive browser UI for visual evaluation
- `src/screening/evaluate.test.js` — 19 test cases across 5 suites

**Architecture pattern:** Strategy pattern. Screeners are interchangeable async functions. The evaluation loop and metrics computation don't know or care which screener is running.

**Infrastructure:** None. Runs on `node --test` and `npx vite dev`. API keys optional for real AI screeners.

**Deployment:** [evidence-gap-map-visualisation-bu8q.vercel.app](https://evidence-gap-map-visualisation-bu8q.vercel.app/)

---

## System 2: Evidence Gap Map (`evd/`)

**What it does:** An interactive single-page application that visualises research studies across a 2D grid. Rows are **interventions** (e.g., "Conditional Cash Transfers"), columns are **outcomes** (e.g., "Food Security"). Each cell shows the count of studies for that intervention-outcome pair, color-coded by density. Empty cells (evidence gaps) are visually highlighted.

The app ships with 48 pre-loaded mock studies across an 8×8 grid, representing realistic development-economics research topics. The data layer is abstracted so it can be swapped for a real API (OpenAlex, PubMed) with minimal effort.

**Stack:** React 19 + Vite 8, Vitest + Testing Library, Storybook 9, Lucide icons, axe-core for accessibility, GitHub Actions CI, Vercel deployment.

**Key components:**
- `EvidenceGapMap.jsx` — Core grid with CSS Grid layout, filterable by intervention/outcome name
- `StudyModal.jsx` — Accessible dialog (`role="dialog"`, `aria-modal="true"`) showing study details
- `useEGMData.js` — Hook that builds the study matrix from flat data
- `Legend.jsx` — Color scale legend (5 levels from "no studies" to "6+")
- `ErrorBoundary.jsx` — Class-based error boundary with retry button
- `SkeletonLoader.jsx` — Shimmer placeholder during initial load

**Testing:** 26 tests across 6 files, including axe-core accessibility audits.

**Architecture pattern:** Component-based React with custom hooks for data management. No routing library — single-page with state-driven modal. Data access abstracted behind a hook that can be retargeted to any API.

**Infrastructure:** None required for development. Optional: Vercel for deployment, GitHub Actions for CI.

**Deployment:** [evidence-gap-map-visualisation-kohl.vercel.app](https://evidence-gap-map-visualisation-kohl.vercel.app)

---

## System 3: Document Ingestion Endpoint (`b1-document_ingestion_endpoint/`)

**What it does:** A full-stack application that accepts PDF file uploads, extracts bibliographic metadata (DOI, title, abstract, authors, year) using regex heuristics, and stores the results in PostgreSQL via Prisma ORM. Duplicate detection by DOI: existing documents are returned instead of re-created.

**Stack:** Node.js + Express 5 (backend), React 19 + Vite 8 (frontend shell), Prisma 7 + PostgreSQL, Multer 2 (file upload), pdf-parse (text extraction), Vitest + Supertest (testing).

**API endpoints:**
- `POST /api/documents` — Upload a PDF, extract metadata, store/return
- `GET /api/health` — Health check

**Key architectural decisions:**
- **Dual-environment** — Business logic lives in a single shared handler imported by both the Express route and the Vercel serverless function
- **In-memory file processing** — Multer `memoryStorage()` keeps uploaded PDFs in memory; no temp files on disk
- **Regex-based extraction** — Heuristic patterns for DOI, title, abstract, authors, and year from raw PDF text
- **Database-level dedup** — `doi` field has `@unique` constraint in Prisma schema

**Testing:** 7 tests (3 unit, 4 integration) with mocked Prisma and pdf-parse.

**Infrastructure required:** PostgreSQL database. See `b1-document_ingestion_endpoint/.env.example` for connection string format.

**Deployment:** [evidence-gap-map-visualisation-op6r.vercel.app](https://evidence-gap-map-visualisation-op6r.vercel.app/)

---

## Comparison

| Dimension | Abstract Screening Harness | Evidence Gap Map | Document Ingestion API |
|---|---|---|---|
| **Domain** | Systematic review / evidence synthesis | Development economics research | Academic PDF processing |
| **Primary user** | Researcher running AI screening tests | Policy maker exploring evidence gaps | Librarian / researcher uploading papers |
| **Architecture** | CLI + Browser UI (pure frontend) | SPA (pure frontend) | API + SPA shell (full-stack) |
| **Data** | Static JS module (20 abstracts) | Static JS module (48 mock studies) | PostgreSQL via Prisma ORM |
| **AI integration** | Mock + OpenAI + Mistral factories | None | None (regex-based extraction) |
| **Testing** | `node:test` (19 tests) | Vitest + Testing Library (26 tests) | Vitest + Supertest (7 tests) |
| **Accessibility** | Basic | axe-core audit + Storybook a11y addon | N/A (API-focused) |
| **CI/CD** | None | GitHub Actions + Vercel | Vercel (manual deploy) |
| **Infrastructure needs** | None | None | PostgreSQL database |
| **Component library** | Storybook (5 stories) | N/A | N/A |

---

## How the Systems Relate

These three projects tackle adjacent problems in the **research evidence synthesis** workflow:

1. **Document Ingestion** — ingests raw PDFs and extracts structured metadata (System 3)
2. **Abstract Screening** — evaluates AI models that classify abstracts as relevant/irrelevant (System 1)
3. **Evidence Mapping** — visualises the resulting evidence landscape to identify research gaps (System 2)

In a production evidence-synthesis pipeline, they would connect as:

```
PDF Upload → Metadata Extraction → AI Screening → Evidence Gap Map
  (Sys 3)        (Sys 3)            (Sys 1)         (Sys 2)
```

Each system was designed independently for this assessment, but the data flow above shows how they could compose into an end-to-end research intelligence platform.
