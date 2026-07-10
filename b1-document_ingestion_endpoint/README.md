# Document Ingestion Endpoint

A Node.js + Express API that accepts PDF uploads, extracts bibliographic metadata (DOI, title, abstract, authors, year), and stores the results in PostgreSQL via Prisma. Duplicate detection is handled by DOI — if a document with the same DOI already exists, the existing record is returned instead of creating a duplicate.

Built as a technical assessment for a software engineering role.

---

## Architecture

```
                        ┌──────────────────────┐
  POST /api/documents   │   Express / Vercel    │
  (multipart PDF) ─────▶│   Serverless Function │
                        │                      │
                        │  ┌────────────────┐  │
                        │  │  Shared Handler │  │
                        │  │  (business      │  │
                        │  │   logic)        │  │
                        │  └───────┬────────┘  │
                        │          │            │
                        │  ┌───────▼────────┐  │
                        │  │  pdfParser.js   │  │
                        │  │  (regex         │  │
                        │  │   extraction)   │  │
                        │  └───────┬────────┘  │
                        │          │            │
                        │  ┌───────▼────────┐  │
                        │  │   Prisma ORM   │  │
                        │  │  (PostgreSQL)  │  │
                        │  └────────────────┘  │
                        └──────────────────────┘
```

The codebase is structured to run in two environments:

| Environment | Entry point | Framework |
|---|---|---|
| **Local dev** | `src/server/index.js` | Express 5 |
| **Vercel deploy** | `api/documents.js` | Vercel Serverless Function |

Both share the same business logic via `src/server/handlers/documents.js`.

---

## Project structure

```
prisma/
├── migrations/              # Timestamped migration files
│   └── 20260710201156_init/
│       └── migration.sql
├── schema.prisma            # Document model definition
└── prisma.config.ts         # Prisma 7 CLI config (datasource URL, schema path)

src/
├── server/
│   ├── index.js             # Express app setup + health check
│   ├── prisma.js            # PrismaClient singleton (PG adapter)
│   ├── routes/
│   │   └── documents.js     # Express route: multer upload + validation
│   └── handlers/
│       └── documents.js     # Shared business logic (extract → dedup → persist)
└── services/
    └── pdfParser.js         # PDF text extraction + regex metadata parsing

api/
└── documents.js             # Vercel Serverless Function (shared handler)

tests/
├── pdfParser.test.js        # Unit tests: regex extraction (3 tests)
└── documents.test.js        # Integration tests: HTTP endpoint (4 tests)

vercel.json                  # Vercel deployment config
.eslint.config.js            # ESLint flat config
package.json                 # Dependencies + scripts
.env.example                 # Environment variable template
```

---

## Key components

### PDF Parser (`src/services/pdfParser.js`)

Uses `pdf-parse` to extract raw text from the uploaded PDF, then applies regex patterns to locate structured metadata:

| Field | Strategy | Regex / heuristic |
|---|---|---|
| **DOI** | Match known DOI pattern | `10.\d{4,}/[-._;()/:A-Za-z0-9]+` |
| **Title** | Text from start until first author-like or section-header line | Lines before `abstract`/`introduction`/etc., filtering out lines with ≥2 commas or isolated years |
| **Abstract** | Text between `Abstract` header and next section | `/abstract\s*[:–—]?\s*([\s\S]+?)(?=\n\s*(keywords|introduction|...)\b)/i` |
| **Authors** | Either an `Authors:` label or the first comma-separated name block after the title | Two code paths: labeled (`Authors:`) or positional (first block with commas/`and`) |
| **Year** | First 4-digit number in range 1900–2099 | `/\b(19|20)\d{2}\b/` |

Section header patterns are consolidated into shared constants (`SECTION_HEADER`, `SECTION_HEADER_OR_AFFILIATION`) to avoid regex duplication across extraction functions.

### Shared handler (`src/server/handlers/documents.js`)

Contains the pure business logic in a single async function:

1. `extractMetadata(pdfBuffer)` → extracts structured data
2. Reject if DOI is missing (400)
3. `prisma.document.findUnique({ where: { doi } })` → dedup check
4. Return existing record (200) or create new (201)

This handler is imported by both the Express route and the Vercel function, eliminating duplication.

### Express server (`src/server/index.js`)

Minimal Express 5 setup:
- `GET /api/health` — health check (useful for load balancers / monitoring)
- `POST /api/documents` — multer-parsed multipart upload → shared handler

### Vercel function (`api/documents.js`)

Standalone serverless function for Vercel deployment. Same `multer` + shared handler pattern.

### Database (`prisma/schema.prisma`)

```prisma
model Document {
  id        Int      @id @default(autoincrement())
  doi       String   @unique
  title     String
  abstract  String?
  authors   String?
  year      Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- **`doi`** is `@unique` — the database enforces the dedup constraint at the storage level
- Uses Prisma 7 with `@prisma/adapter-pg` for connection pooling via `pg.Pool`

---

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Set DATABASE_URL in .env (see .env.example)
#    Uses Prisma 7 — the connection string is read from prisma.config.ts
vi .env

# 3. Generate Prisma client + run migrations
npx prisma generate
npx prisma migrate dev

# 4. Start the server
node src/server/index.js

# 5. Upload a PDF
curl -X POST -F "file=@paper.pdf" http://localhost:3001/api/documents
```

---

## API

### `POST /api/documents`

Upload a PDF file (multipart/form-data).

**Request:**

```
Content-Type: multipart/form-data

file: <binary PDF data>
```

**Responses:**

| Status | Body | Scenario |
|---|---|---|
| `201` | `{ "document": { ... }, "duplicate": false }` | New document created |
| `200` | `{ "document": { ... }, "duplicate": true }` | Existing document with same DOI |
| `400` | `{ "error": "No PDF file uploaded" }` | Missing file |
| `400` | `{ "error": "Could not extract DOI from the PDF" }` | DOI not found in text |
| `413` | `{ "error": "File too large" }` | Exceeds 10 MB limit |
| `500` | `{ "error": "Internal server error" }` | Unexpected error |

### `GET /api/health`

**Response:** `{ "status": "ok" }` (200)

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

| Test file | Type | What it covers |
|---|---|---|
| `tests/pdfParser.test.js` | Unit | Regex extraction (happy path, missing metadata, multi-year disambiguation) |
| `tests/documents.test.js` | Integration | HTTP endpoint (new document, duplicate DOI, missing file, missing DOI) |

Test doubles:
- `pdf-parse` is mocked to return controlled text, isolating regex logic
- `prisma` is mocked to avoid database dependency
- `extractMetadata` is mocked for HTTP tests to focus on routing + dedup

---

## Deployment (Vercel)

```bash
# 1. Push to GitHub organization repo
git push

# 2. Import in Vercel
#    - Auto-detects Vite + api/ functions
#    - Set DATABASE_URL in Environment Variables

# 3. Deploy
#    installCommand: "npm install && npx prisma generate"
#    buildCommand:   "npm run build"
```

The Vite frontend serves as static assets from `dist/`, while `api/documents.js` runs as a serverless function. The `vercel.json` rewrite ensures SPA routing works for the frontend and `/api/*` routes reach the function.

---

## What I would improve with more time

### Production hardening

| Area | Improvement |
|---|---|
| **Security** | Add `helmet` for HTTP headers, `express-rate-limit` to prevent abuse, and input sanitization on extracted metadata |
| **Logging** | Replace `console.error` with a structured logger (`pino` or `winston`) with request IDs for traceability |
| **Validation** | Add a schema validator (Zod or Joi) to validate metadata before persisting — e.g., reject if title is empty, validate DOI format, clamp year to a reasonable range |
| **Error handling** | Use a centralized error handler middleware instead of try/catch in each route. Add proper error classes (`AppError`, `ValidationError`, `NotFoundError`) |
| **CORS** | Configure CORS explicitly for production frontend origins |

### PDF extraction

| Area | Improvement |
|---|---|
| **Accuracy** | The current regex approach is heuristic and will miss or misparse many real-world paper layouts. A dedicated library like `grobid` (via REST API) or a trained ML model (e.g., `science-parse`, `CERMINE`) would be far more robust |
| **Fallback** | Accept a JSON metadata payload alongside the PDF so callers can supply metadata when extraction fails |
| **Validation** | Cross-check extracted DOI against CrossRef API to verify the document exists and fill in gaps |
| **Caching** | Cache extraction results in-memory or via Redis for repeated uploads of the same PDF (by content hash) |

### Reliability & monitoring

| Area | Improvement |
|---|---|
| **Retries** | Add exponential backoff retry to the Prisma/DB layer for transient connection failures |
| **Health check** | Expand `/api/health` to report DB connectivity and last migration status |
| **Metrics** | Expose Prometheus-friendly metrics (request count, latency, extraction success rate) |
| **Testing** | Add snapshot tests for known PDF fixtures, property-based tests for edge-case text, and a load test to verify connection pooling under concurrency |
| **CI/CD** | Add GitHub Actions workflows for lint → test → build on every PR, and auto-deploy on merge to main |

### Code quality

| Area | Improvement |
|---|---|
| **TypeScript** | Convert to TypeScript for compile-time type safety, especially on the Prisma query results and metadata interfaces |
| **Dependency injection** | Make `prisma` and `pdf-parse` injectable so the handler is fully unit-testable without module-level mocks |
| **OpenAPI** | Publish an OpenAPI 3.0 spec for the endpoint so consumers can generate clients and Vercel can validate requests |
| **File size** | `pdf-parse` + `@prisma/adapter-pg` + `pg` add significant cold-start weight for serverless. Consider lazy-loading the parser or using a lighter alternative |
