import { useState, useCallback } from 'react'
import { ABSTRACTS, REVIEW_QUESTION } from './dataset.js'
import { computeMetrics } from './evaluate.js'
import { createMockScreener } from './screener.js'
import './TestPage.css'

function StatusIcon({ correct }) {
  if (correct === true) return <span className="icon icon-pass">&#10003;</span>
  if (correct === false) return <span className="icon icon-fail">&#10007;</span>
  return <span className="icon icon-pending">&ndash;</span>
}

function MetricCard({ label, value, suffix = '%' }) {
  return (
    <div className="metric-card">
      <div className="metric-value">{value}{suffix}</div>
      <div className="metric-label">{label}</div>
    </div>
  )
}

export default function TestPage() {
  const [accuracy, setAccuracy] = useState(0.8)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [lastSeed, setLastSeed] = useState(null)

  const runEvaluation = useCallback(async () => {
    setRunning(true)
    setResults(null)

    const seed = Date.now()
    const screener = createMockScreener({ accuracy, seed })
    const items = []

    for (const abstract of ABSTRACTS) {
      const r = await screener(abstract)
      items.push({
        id: abstract.id,
        title: abstract.title,
        expected: abstract.expected,
        predicted: r.predicted,
        confidence: r.confidence,
      })
    }

    const metrics = computeMetrics(items)
    setResults({ items, metrics })
    setLastSeed(seed)
    setRunning(false)
  }, [accuracy])

  return (
    <div className="test-page">
      <header className="test-header">
        <h1>Abstract Screening Test Harness</h1>
        <p className="research-question">{REVIEW_QUESTION}</p>
      </header>

      <section className="controls">
        <div className="control-row">
          <label htmlFor="accuracy-slider">
            Screener Accuracy: <strong>{(accuracy * 100).toFixed(0)}%</strong>
          </label>
          <input
            id="accuracy-slider"
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={accuracy}
            onChange={e => setAccuracy(parseFloat(e.target.value))}
          />
        </div>
        <div className="control-row">
          <span className="abstract-count">
            Dataset: {ABSTRACTS.length} abstracts
            ({ABSTRACTS.filter(a => a.expected === 'include').length} include,{' '}
            {ABSTRACTS.filter(a => a.expected === 'exclude').length} exclude)
          </span>
          <button
            className="run-button"
            onClick={runEvaluation}
            disabled={running}
          >
            {running ? 'Screening...' : 'Run Evaluation'}
          </button>
        </div>
      </section>

      {results && (
        <>
          <section className="metrics-section">
            <h2>Results</h2>
            {lastSeed && (
              <p className="seed-info">Seed: {lastSeed} &mdash; Accuracy setting: {(accuracy * 100).toFixed(0)}%</p>
            )}
            <div className="metrics-grid">
              <MetricCard label="Accuracy" value={(results.metrics.accuracy * 100).toFixed(1)} />
              <MetricCard label="Precision" value={(results.metrics.precision * 100).toFixed(1)} />
              <MetricCard label="Recall" value={(results.metrics.recall * 100).toFixed(1)} />
              <MetricCard label="Specificity" value={(results.metrics.specificity * 100).toFixed(1)} />
              <MetricCard label="F1 Score" value={(results.metrics.f1 * 100).toFixed(1)} />
            </div>
          </section>

          <section className="matrix-section">
            <h2>Confusion Matrix</h2>
            <table className="confusion-matrix">
              <thead>
                <tr>
                  <th></th>
                  <th>Predicted Include</th>
                  <th>Predicted Exclude</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Actual Include</th>
                  <td className="cell-tp">{results.metrics.tp}</td>
                  <td className="cell-fn">{results.metrics.fn}</td>
                </tr>
                <tr>
                  <th>Actual Exclude</th>
                  <td className="cell-fp">{results.metrics.fp}</td>
                  <td className="cell-tn">{results.metrics.tn}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="abstracts-section">
            <h2>Per-Abstract Results</h2>
            <table className="abstracts-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Expected</th>
                  <th>Predicted</th>
                  <th>Confidence</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.items.map(r => {
                  const correct = r.predicted === r.expected
                  return (
                    <tr key={r.id} className={correct ? 'row-pass' : 'row-fail'}>
                      <td>{r.id}</td>
                      <td className="title-cell">{r.title}</td>
                      <td><span className={`badge badge-${r.expected}`}>{r.expected}</span></td>
                      <td><span className={`badge badge-${r.predicted}`}>{r.predicted}</span></td>
                      <td>{(r.confidence * 100).toFixed(0)}%</td>
                      <td><StatusIcon correct={correct} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </>
      )}

      {!results && !running && (
        <section className="empty-state">
          <p>Adjust the accuracy setting and click <strong>Run Evaluation</strong> to test the screener against the ground-truth dataset.</p>
          <p>The mock screener simulates an AI with configurable accuracy, making deterministic errors based on a seeded random number generator.</p>
        </section>
      )}
    </div>
  )
}
