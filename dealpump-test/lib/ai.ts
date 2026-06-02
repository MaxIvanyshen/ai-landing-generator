import OpenAI from 'openai'

export const ai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

export const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'
