import OpenAI from "openai"

let _client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

export const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-5.4-mini-2026-03-17"
