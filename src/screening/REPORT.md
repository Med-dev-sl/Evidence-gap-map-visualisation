# Abstract Screening Evaluation: Design & Findings

## Harness Architecture

```
dataset.js    → 20 abstracts with gold-standard decisions (8 include, 12 exclude)
evaluate.js   → computeMetrics(), formatReport() — pure functions, no IO
screener.js   → createMockScreener(), createMistralScreener(), createOpenAIScreener()
evaluate.test.js → node:test harness (19 tests, all passing)
run.js        → CLI: node run.js <mode> [delayMs]
```

**Swappability**: A screener is any async function `(abstract) → { predicted, confidence }`. The `createOpenAICompatibleScreener()` factory takes a `baseUrl` parameter — both OpenAI and Mistral use the same code path with different configs. Add a new provider by calling the factory with its base URL and model name.

**Rate-limiting**: The harness includes exponential-backoff retry (up to 5 attempts) for 429 responses, plus a configurable inter-request delay.

## Results: Mistral Large (mistral-large-latest)

All 20 abstracts processed with 5s delay between requests.

| Metric      | Value  |
|-------------|--------|
| Accuracy    | 85.0%  |
| Precision   | 100.0% |
| Recall      | 62.5%  |
| Specificity | 100.0% |
| F1          | 76.9%  |

### Confusion Matrix

```
                 Predicted Include    Predicted Exclude
Actual Include          5                   3
Actual Exclude          0                  12
```

### Errors (False Negatives)

| # | Abstract | Why it was missed |
|---|----------|-------------------|
| 5 | Group vs individual exercise therapy | Compares two exercise formats rather than exercise vs control |
| 16 | Network meta-analysis of exercise vs manual therapy | Comparator is manual therapy, not usual care |
| 17 | Adherence to home exercise programs (cohort study) | Observational design, not an RCT |

Mistral took a conservative approach: **zero false positives** (never included an irrelevant abstract), but missed 3 of the 8 relevant ones — all borderline cases where the study design or comparator deviated from the strict RCT-vs-control template.

## Usage

```bash
node --test src/screening/             # run harness tests
node run.js mock 0.8                   # mock screener
MISTRAL_API_KEY="..." node run.js mistral 3000  # Mistral, 3s delay
OPENAI_API_KEY="..." node run.js openai 2000    # OpenAI, 2s delay
```
