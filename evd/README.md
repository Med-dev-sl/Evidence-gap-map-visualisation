# Evidence Gap Map

An interactive evidence gap map that visualises research studies across a 2D grid of interventions (rows) and outcomes (cells show study counts). Built with React + Vite.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint across all files |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file change) |
| `npm run storybook` | Start Storybook dev server on port 6006 |
| `npm run storybook:build` | Build static Storybook for deployment |
| `npm run test:a11y` | Run axe-core accessibility audit |

## Project Structure

```
src/
├── components/
│   ├── EvidenceGapMap.jsx   # Main grid: rows=interventions, cols=outcomes
│   ├── StudyModal.jsx       # Modal listing study details on cell click
│   ├── Legend.jsx            # Color scale legend
│   ├── ErrorBoundary.jsx    # Catches runtime errors, shows retry UI
│   └── SkeletonLoader.jsx   # Shimmer loading skeleton
├── hooks/
│   ├── useEGMData.js        # Data layer: matrix build, filtering, cell lookup
│   └── useDebounce.js       # 300ms debounce on search input
├── utils/
│   └── getLevelClass.js     # Maps study count → CSS class (5 levels)
├── data/
│   └── mockData.js          # 48 mock studies across 8×8 grid
└── __tests__/               # 26 tests (vitest + testing-library)
```

## How It Works

1. **Data**: Studies are defined in `src/data/mockData.js`. Each study has an `intervention`, `outcome`, `title`, `authors`, `year`, and `journal`.

2. **Matrix**: `useEGMData` builds a lookup matrix keyed by `intervention|||outcome`. Clicking a cell retrieves studies from this matrix.

3. **Color coding**: Cells are coloured by study count:
   - Empty (dashed border) = 0 studies (gap)
   - Light green = 1 study
   - Medium green = 2–3 studies
   - Darker green = 4–5 studies
   - Solid green = 6+ studies

4. **Search**: Type in the filter box to narrow rows and columns by name.

5. **Modal**: Click any populated cell to see the full list of studies (title, authors, year, journal). Close with the X button, clicking outside, or pressing Escape.

## Tech Stack

- **React 19** with JSX (no TypeScript)
- **Vite** for build tooling
- **lucide-react** for icons
- **Storybook 9** for component isolation and visual review
- **vitest** + **@testing-library/react** for unit/integration tests
- **axe-core** + **Playwright** for accessibility auditing
- **ESLint** for linting
- **GitHub Actions** for CI/CD

## Storybook

Storybook lets you browse and test each component in isolation — without starting the full app.

```bash
npm run storybook
```

Opens [http://localhost:6006](http://localhost:6006) with a sidebar listing every component:

- **EvidenceGapMap** — the full interactive grid
- **StudyModal** — with sample data pre-loaded
- **Legend** — the color scale
- **ErrorBoundary** — normal state and error state
- **SkeletonLoader** — shimmer loading animation

The `@storybook/addon-a11y` addon is built in — it flags accessibility violations directly in the Storybook panel as you browse components.

## Accessibility

The app is tested with **axe-core** (via Playwright) for WCAG compliance:

```bash
npm run test:a11y
```

This runs a real Chromium browser against rendered components and reports any critical violations. The Storybook a11y addon also provides live feedback while browsing components.

Key accessibility features:
- ARIA labels on all interactive cells
- Keyboard support (ESC to close modal, overlay click to dismiss)
- Dialog role on modal with `aria-modal="true"`
- Disabled state on empty cells (not focusable via Tab)
- Proper heading hierarchy

## CI/CD (GitHub Actions)

A GitHub Actions pipeline (`.github/workflows/ci.yml`) runs automatically on every push to `main` and every pull request:

1. **Lint + Test + Build** — runs on Node 20 and 22 in parallel
2. **Accessibility audit** — builds Storybook, then runs axe-core against rendered components

If any step fails, the PR is blocked from merging.

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Vite — no configuration needed
4. Every push to `main` triggers a deploy

No environment variables, databases, or backend services required.

## Replacing Mock Data with Real Data

The data layer is abstracted in `useEGMData`. To use real data:

1. Fetch studies from your API (e.g. OpenAlex, PubMed)
2. Pass them to `setStudies()` inside the hook
3. Ensure each study has: `intervention`, `outcome`, `title`, `authors`, `year`, `journal`

```js
// Example: fetch from API
useEffect(() => {
  fetch("/api/studies")
    .then((res) => res.json())
    .then((data) => setStudies(data));
}, []);
```

## Testing

Run all 26 tests:

```bash
npm run test
```

Tests cover:
- `getLevelClass` — all boundary values
- `Legend` — renders all 5 levels
- `StudyModal` — renders studies, closes on click/Escape
- `ErrorBoundary` — catches errors, shows retry
- `EvidenceGapMap` — grid renders, cells clickable, empty cells disabled
