import { ABSTRACTS } from './dataset.js'
import { computeMetrics, formatReport } from './evaluate.js'
import { createMockScreener, createOpenAIScreener, createMistralScreener } from './screener.js'
import { sleep } from './screener.js'

async function main() {
  const mode = process.argv[2] || 'mock'
  let screener
  let label

  switch (mode) {
    case 'mock': {
      const accuracy = parseFloat(process.argv[3]) || 0.8
      const seed = parseInt(process.argv[4]) || 42
      screener = createMockScreener({ accuracy, seed })
      label = `Mock Screener (accuracy=${accuracy}, seed=${seed})`
      break
    }
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.error('Set OPENAI_API_KEY environment variable to use OpenAI.')
        process.exit(1)
      }
      screener = createOpenAIScreener({
        apiKey,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      })
      label = `OpenAI Screener (${process.env.OPENAI_MODEL || 'gpt-4o-mini'})`
      break
    }
    case 'mistral': {
      const apiKey = process.env.MISTRAL_API_KEY
      if (!apiKey) {
        console.error('Set MISTRAL_API_KEY environment variable to use Mistral.')
        process.exit(1)
      }
      screener = createMistralScreener({
        apiKey,
        model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
      })
      label = `Mistral Screener (${process.env.MISTRAL_MODEL || 'mistral-large-latest'})`
      break
    }
    default: {
      console.error(`Unknown mode: ${mode}. Use 'mock', 'openai', or 'mistral'.`)
      process.exit(1)
    }
  }

  const delayMs = parseInt(process.argv[3]) || 2000
  console.log(`\n  Evaluating: ${label}`)
  console.log(`  Abstracts:  ${ABSTRACTS.length}`)
  console.log(`  Delay:      ${delayMs}ms between requests`)

  console.time('  Duration')
  const results = []
  for (const abstract of ABSTRACTS) {
    try {
      const r = await screener(abstract)
      results.push({
        id: abstract.id,
        expected: abstract.expected,
        predicted: r.predicted,
        confidence: r.confidence,
      })
    } catch (err) {
      results.push({
        id: abstract.id,
        expected: abstract.expected,
        predicted: 'error',
        error: err.message,
      })
    }
    await sleep(delayMs)
  }
  console.timeEnd('  Duration')

  const metrics = computeMetrics(results)
  const report = formatReport(label, metrics, results, true)
  console.log(report)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
