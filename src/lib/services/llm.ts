/**
 * Provider-agnostic LLM access for text generation.
 *
 * Default provider is Groq (free tier, privacy-safe: inference is not retained
 * or trained on by default). Gemini stays a drop-in fallback for when volume
 * outgrows Groq's free daily cap. Select via env:
 *
 *   LLM_PROVIDER=groq|gemini   (default: groq)
 *   LLM_MODEL=<model id>       (default per provider below)
 *   GROQ_API_KEY / GEMINI_API_KEY
 *
 * Callers use generateJSON()/generateText() and never see the provider.
 */
import Groq from 'groq-sdk'
import { GoogleGenAI } from '@google/genai'

export type LLMProvider = 'groq' | 'gemini'

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  // Pinned explicitly — Groq's free catalog shifts; llama-3.3-70b is stable.
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-2.5-flash',
}

interface GenerateOptions {
  /** Max output tokens. */
  maxTokens?: number
  /** Ask the provider for a strict JSON object response. */
  json?: boolean
}

function provider(): LLMProvider {
  const p = (process.env.LLM_PROVIDER || 'groq').toLowerCase()
  return p === 'gemini' ? 'gemini' : 'groq'
}

function apiKeyFor(p: LLMProvider): string | undefined {
  return p === 'gemini' ? process.env.GEMINI_API_KEY : process.env.GROQ_API_KEY
}

function model(): string {
  return process.env.LLM_MODEL || DEFAULT_MODELS[provider()]
}

/**
 * Whether the app can serve AI features. True if the ACTIVE provider's key is
 * set, OR any supported provider key is present (keeps the route guard lenient
 * so a configured-but-non-default key still enables the feature).
 */
export function isLLMConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY)
}

// Lazy singletons — one client per provider, created on first use.
let groqClient: Groq | null = null
let geminiClient: GoogleGenAI | null = null

function getGroq(): Groq {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not configured')
  if (!groqClient) groqClient = new Groq({ apiKey: key })
  return groqClient
}

function getGemini(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not configured')
  if (!geminiClient) geminiClient = new GoogleGenAI({ apiKey: key })
  return geminiClient
}

/**
 * Generate a completion for a single prompt. Returns the raw text (which the
 * caller parses). Routes to the configured provider.
 */
export async function generate(
  prompt: string,
  { maxTokens = 1000, json = false }: GenerateOptions = {}
): Promise<string> {
  const active = provider()

  // Fall back to the other provider if the active one has no key but the
  // other does — avoids a hard failure on a partial env.
  const usable: LLMProvider = apiKeyFor(active)
    ? active
    : active === 'groq'
      ? 'gemini'
      : 'groq'

  if (usable === 'groq') {
    const res = await getGroq().chat.completions.create({
      model: model(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    })
    return res.choices[0]?.message?.content ?? ''
  }

  const res = await getGemini().models.generateContent({
    model: process.env.LLM_MODEL || DEFAULT_MODELS.gemini,
    contents: prompt,
    config: {
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  })
  return res.text ?? ''
}

/** Generate a strict-JSON completion (provider JSON mode enabled). */
export function generateJSON(prompt: string, maxTokens = 1000): Promise<string> {
  return generate(prompt, { maxTokens, json: true })
}

/** Generate a plain-text completion. */
export function generateText(prompt: string, maxTokens = 300): Promise<string> {
  return generate(prompt, { maxTokens, json: false })
}
