import OpenAI from 'openai'

let _ai: OpenAI | null = null

export function getAI(): OpenAI {
  if (!_ai) {
    _ai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY ?? 'missing',
    })
  }
  return _ai
}

export const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'
