import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Capture constructor args + call args for both SDKs.
const groqCreate = vi.fn()
const geminiGenerate = vi.fn()

vi.mock('groq-sdk', () => ({
  default: class {
    chat = { completions: { create: groqCreate } }
  },
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: geminiGenerate }
  },
}))

async function freshImport() {
  vi.resetModules()
  return import('./llm')
}

describe('llm provider layer', () => {
  beforeEach(() => {
    groqCreate.mockReset()
    geminiGenerate.mockReset()
    groqCreate.mockResolvedValue({ choices: [{ message: { content: 'groq-out' } }] })
    geminiGenerate.mockResolvedValue({ text: 'gemini-out' })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('isLLMConfigured is false with no keys, true with either key', async () => {
    let mod = await freshImport()
    expect(mod.isLLMConfigured()).toBe(false)

    vi.stubEnv('GROQ_API_KEY', 'gsk_x')
    mod = await freshImport()
    expect(mod.isLLMConfigured()).toBe(true)

    vi.unstubAllEnvs()
    vi.stubEnv('GEMINI_API_KEY', 'g_x')
    mod = await freshImport()
    expect(mod.isLLMConfigured()).toBe(true)
  })

  it('defaults to Groq and passes JSON mode + max_tokens', async () => {
    vi.stubEnv('GROQ_API_KEY', 'gsk_x')
    const { generateJSON } = await freshImport()

    const out = await generateJSON('hello', 500)
    expect(out).toBe('groq-out')
    expect(groqCreate).toHaveBeenCalledOnce()
    const arg = groqCreate.mock.calls[0][0]
    expect(arg.model).toBe('llama-3.3-70b-versatile')
    expect(arg.max_tokens).toBe(500)
    expect(arg.response_format).toEqual({ type: 'json_object' })
    expect(geminiGenerate).not.toHaveBeenCalled()
  })

  it('routes to Gemini when LLM_PROVIDER=gemini', async () => {
    vi.stubEnv('LLM_PROVIDER', 'gemini')
    vi.stubEnv('GEMINI_API_KEY', 'g_x')
    const { generateText } = await freshImport()

    const out = await generateText('hi', 300)
    expect(out).toBe('gemini-out')
    expect(geminiGenerate).toHaveBeenCalledOnce()
    expect(groqCreate).not.toHaveBeenCalled()
  })

  it('falls back to the other provider when the active one has no key', async () => {
    // Active = groq (default) but only Gemini key present → should use Gemini.
    vi.stubEnv('GEMINI_API_KEY', 'g_x')
    const { generateJSON } = await freshImport()

    const out = await generateJSON('x')
    expect(out).toBe('gemini-out')
    expect(geminiGenerate).toHaveBeenCalledOnce()
  })

  it('honors LLM_MODEL override', async () => {
    vi.stubEnv('GROQ_API_KEY', 'gsk_x')
    vi.stubEnv('LLM_MODEL', 'llama-3.1-8b-instant')
    const { generateJSON } = await freshImport()

    await generateJSON('x')
    expect(groqCreate.mock.calls[0][0].model).toBe('llama-3.1-8b-instant')
  })
})
