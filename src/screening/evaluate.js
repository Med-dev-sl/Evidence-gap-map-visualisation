export function computeMetrics(results) {
  let tp = 0, fp = 0, fn = 0, tn = 0

  for (const r of results) {
    if (r.predicted === 'include' && r.expected === 'include') tp++
    else if (r.predicted === 'include' && r.expected === 'exclude') fp++
    else if (r.predicted === 'exclude' && r.expected === 'include') fn++
    else if (r.predicted === 'exclude' && r.expected === 'exclude') tn++
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0
  const total = tp + fp + fn + tn
  const accuracy = total > 0 ? (tp + tn) / total : 0

  return {
    tp, fp, fn, tn,
    precision: round(precision),
    recall: round(recall),
    specificity: round(specificity),
    f1: round(f1),
    accuracy: round(accuracy),
    confusionMatrix: {
      'Predicted Include': { 'Actual Include': tp, 'Actual Exclude': fp },
      'Predicted Exclude': { 'Actual Include': fn, 'Actual Exclude': tn },
    },
  }
}

function round(v, decimals = 4) {
  return Math.round(v * 10 ** decimals) / 10 ** decimals
}

export function formatReport(header, metrics, items, details = false) {
  let out = `\n${'='.repeat(60)}\n`
  out += `  ${header}\n`
  out += `${'='.repeat(60)}\n`
  out += `  Accuracy:     ${(metrics.accuracy * 100).toFixed(1)}%\n`
  out += `  Precision:    ${(metrics.precision * 100).toFixed(1)}%\n`
  out += `  Recall:       ${(metrics.recall * 100).toFixed(1)}%\n`
  out += `  Specificity:  ${(metrics.specificity * 100).toFixed(1)}%\n`
  out += `  F1 Score:     ${(metrics.f1 * 100).toFixed(1)}%\n\n`
  out += `  Confusion Matrix:\n`
  out += `                 Predicted Include    Predicted Exclude\n`
  out += `  Actual Include        ${String(metrics.tp).padStart(3)}                 ${String(metrics.fn).padStart(3)}\n`
  out += `  Actual Exclude        ${String(metrics.fp).padStart(3)}                 ${String(metrics.tn).padStart(3)}\n`
  out += `${'='.repeat(60)}\n`

  if (details && items.length > 0) {
    out += `\n  Per-Abstract Results:\n`
    out += `  ${'-'.repeat(56)}\n`
    for (const r of items) {
      const mark = r.predicted === r.expected ? '✓' : '✗'
      out += `  [${mark}] #${String(r.id).padStart(2)} ${r.predicted.padEnd(8)} (expected ${r.expected.padEnd(8)})\n`
      if (r.error) out += `       Error: ${r.error}\n`
    }
    out += `  ${'-'.repeat(56)}\n`
  }

  return out
}

export function formatConfusionMatrixForTest(metrics) {
  return {
    tp: metrics.tp,
    fp: metrics.fp,
    fn: metrics.fn,
    tn: metrics.tn,
    precision: metrics.precision,
    recall: metrics.recall,
    f1: metrics.f1,
    accuracy: metrics.accuracy,
  }
}
