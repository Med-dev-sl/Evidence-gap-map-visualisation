import { ABSTRACTS, REVIEW_QUESTION } from './dataset.js'

export function createMockScreener({ accuracy = 0.8, seed = 42 } = {}) {
  const decisions = ABSTRACTS.map(a => a.expected)
  const rng = mulberry32(seed)
  const errors = decisions.map(() => rng() < 1 - accuracy)

  return async function mockScreener(abstract) {
    const idx = ABSTRACTS.findIndex(a => a.id === abstract.id)
    const correct = decisions[idx]
    const flip = errors[idx]

    await sleep(5 + Math.random() * 10)

    return {
      id: abstract.id,
      predicted: flip ? (correct === 'include' ? 'exclude' : 'include') : correct,
      confidence: flip ? 0.5 + rng() * 0.3 : 0.7 + rng() * 0.3,
    }
  }
}

const DEFAULT_SYSTEM_PROMPT = [
  'You are screening abstracts for a systematic review.',
  `Research question: ${REVIEW_QUESTION}`,
  '',
  'Respond with a single JSON object:',
  '{"decision": "include" or "exclude", "confidence": 0.0-1.0, "reason": "brief justification"}',
].join('\n')

function buildUserMessage(abstract) {
  return `Title: ${abstract.title}\n\nAbstract: ${abstract.abstract}`
}

export function createOpenAICompatibleScreener({ apiKey, baseUrl, model, prompt } = {}) {
  if (!apiKey) {
    throw new Error('API key is required. Set the appropriate environment variable.')
  }

  return async function screener(abstract) {
    const systemPrompt = prompt || DEFAULT_SYSTEM_PROMPT

    const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: buildUserMessage(abstract) },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    const body = await response.json()
    const result = JSON.parse(body.choices[0].message.content)

    return {
      id: abstract.id,
      predicted: result.decision,
      confidence: result.confidence,
      reason: result.reason,
    }
  }
}

export function createOpenAIScreener({ apiKey, model = 'gpt-4o-mini', prompt } = {}) {
  return createOpenAICompatibleScreener({
    apiKey,
    baseUrl: 'https://api.openai.com/v1',
    model,
    prompt,
  })
}

export function createMistralScreener({ apiKey, model = 'mistral-large-latest', prompt } = {}) {
  return createOpenAICompatibleScreener({
    apiKey,
    baseUrl: 'https://api.mistral.ai/v1',
    model,
    prompt,
  })
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    var t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    if (response.ok) return response
    if (response.status === 429 && attempt < maxRetries) {
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 30000)
      console.warn(`    Rate limited. Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${maxRetries})`)
      await sleep(delay)
      continue
    }
    const err = await response.text()
    throw new Error(`API error (${response.status}): ${err}`)
  }
  throw new Error('Max retries exceeded')
}
