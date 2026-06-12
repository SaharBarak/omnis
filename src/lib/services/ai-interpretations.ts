import { GoogleGenAI } from '@google/genai'
import type {
  PredictionEvent,
  AIInterpretationRequest,
  AIInterpretationResponse,
} from '@/lib/types/prediction'
import type { Kin } from '@/core/types'
import {
  getCachedInterpretation as getCachedInterpretationRow,
  cacheInterpretation as cacheInterpretationRow,
} from '@/lib/db/repositories/predictions-repo'

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return geminiClient
}

// Configuration
const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '1000', 10)

// Cache TTL (30 days in milliseconds)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

// ============================================================================
// Generate Interpretation
// ============================================================================

/**
 * Generate AI interpretation for a prediction event
 */
export async function generateInterpretation(
  request: AIInterpretationRequest
): Promise<AIInterpretationResponse> {
  const { prediction, personContext, locale = 'en' } = request

  // Check cache first
  const cached = await getCachedInterpretation(prediction)
  if (cached) {
    return cached
  }

  // Build the prompt
  const prompt = buildInterpretationPrompt(prediction, personContext, locale)

  try {
    // Call Gemini API (JSON mode; existing parser handles extraction)
    const result = await getGeminiClient().models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: AI_MAX_TOKENS,
        responseMimeType: 'application/json',
      },
    })

    const responseText = result.text ?? ''

    // Parse the response
    const interpretation = parseInterpretationResponse(responseText)

    // Cache the interpretation
    await cacheInterpretation(prediction, interpretation)

    return interpretation
  } catch (error) {
    console.error('Error generating AI interpretation:', error)
    throw new Error('Failed to generate interpretation')
  }
}

// ============================================================================
// Prompt Building
// ============================================================================

function buildInterpretationPrompt(
  prediction: PredictionEvent,
  personContext?: AIInterpretationRequest['personContext'],
  locale: 'en' | 'he' = 'en'
): string {
  const languageInstruction =
    locale === 'he'
      ? 'Please respond in Hebrew.'
      : 'Please respond in English.'

  let contextSection = ''
  if (personContext) {
    contextSection = `
Personal Context:
- Birth Date: ${personContext.birthDate}
- Birth Kin: ${personContext.birthKin}
${personContext.currentAge ? `- Current Age: ${personContext.currentAge}` : ''}
${personContext.personalYearKin ? `- Personal Year Kin: ${personContext.personalYearKin}` : ''}
`
  }

  return `You are a wise cosmic guide providing personalized interpretations based on the Mayan calendar systems (Dreamspell and Traditional Tzolkin).

${languageInstruction}

Please provide a thoughtful interpretation for the following prediction event:

Event Details:
- Type: ${prediction.type}
- System: ${prediction.system}
- Title: ${prediction.title}
- Start Date: ${prediction.startDate}
- End Date: ${prediction.endDate}
- Intensity: ${prediction.intensity}
- Themes: ${prediction.themes.join(', ')}
- Description: ${prediction.description}
${prediction.data ? `- Additional Data: ${JSON.stringify(prediction.data)}` : ''}
${contextSection}

Please provide:
1. A personalized interpretation (2-3 paragraphs) that explains the significance of this event and how the person can work with this energy.
2. 3-5 key themes or energies to focus on.
3. A short affirmation (1-2 sentences) for this period.
4. Practical guidance (1-2 sentences) for integrating this energy.

Format your response as JSON with the following structure:
{
  "interpretation": "Your interpretation here...",
  "themes": ["theme1", "theme2", "theme3"],
  "affirmation": "Your affirmation here...",
  "guidance": "Your guidance here..."
}

Important: Be inspiring and empowering while remaining grounded. Avoid making specific predictions about external events. Focus on personal growth, self-awareness, and working with cosmic energies.`
}

// ============================================================================
// Response Parsing
// ============================================================================

function parseInterpretationResponse(
  response: string
): AIInterpretationResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        interpretation: parsed.interpretation || response,
        themes: Array.isArray(parsed.themes) ? parsed.themes : [],
        affirmation: parsed.affirmation || undefined,
        guidance: parsed.guidance || undefined,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      }
    }
  } catch (e) {
    // If JSON parsing fails, use the raw response
  }

  // Fallback: use the raw response as interpretation
  return {
    interpretation: response,
    themes: [],
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  }
}

// ============================================================================
// Caching
// ============================================================================

/**
 * Get cached interpretation from database (Mongo via predictions-repo).
 */
async function getCachedInterpretation(
  prediction: PredictionEvent
): Promise<AIInterpretationResponse | null> {
  if (!prediction.id) {
    return null
  }

  try {
    const data = await getCachedInterpretationRow(prediction.id)

    if (!data || !data.interpretation) {
      return null
    }

    // Check if cache is still valid
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    // Parse cached interpretation
    try {
      const cached = JSON.parse(data.interpretation)
      return {
        interpretation: cached.interpretation || data.interpretation,
        themes: cached.themes || [],
        affirmation: cached.affirmation,
        guidance: cached.guidance,
        cachedAt: data.computed_at,
        expiresAt: data.expires_at,
      }
    } catch {
      // If not JSON, return as plain interpretation
      return {
        interpretation: data.interpretation,
        themes: [],
        cachedAt: data.computed_at,
        expiresAt: data.expires_at,
      }
    }
  } catch (error) {
    console.error('Error fetching cached interpretation:', error)
    return null
  }
}

/**
 * Cache interpretation in database (Mongo via predictions-repo).
 */
async function cacheInterpretation(
  prediction: PredictionEvent,
  interpretation: AIInterpretationResponse
): Promise<void> {
  if (!prediction.id) {
    return
  }

  try {
    await cacheInterpretationRow(prediction.id, {
      interpretation: JSON.stringify(interpretation),
      computed_at: interpretation.cachedAt ?? new Date().toISOString(),
      expires_at:
        interpretation.expiresAt ??
        new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    })
  } catch (error) {
    console.error('Error caching interpretation:', error)
  }
}

// ============================================================================
// Quick Interpretation (no caching, for one-off requests)
// ============================================================================

/**
 * Generate a quick interpretation without caching
 */
export async function generateQuickInterpretation(
  eventType: string,
  eventTitle: string,
  eventDescription: string,
  themes: string[],
  locale: 'en' | 'he' = 'en'
): Promise<string> {
  const languageInstruction =
    locale === 'he'
      ? 'Please respond in Hebrew.'
      : 'Please respond in English.'

  const prompt = `You are a wise cosmic guide. ${languageInstruction}

Provide a brief, inspiring interpretation (2-3 sentences) for this cosmic event:
- Event: ${eventTitle}
- Type: ${eventType}
- Description: ${eventDescription}
- Themes: ${themes.join(', ')}

Focus on personal empowerment and working with this energy. Be concise and meaningful.`

  try {
    const result = await getGeminiClient().models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 300,
      },
    })

    return result.text ?? ''
  } catch (error) {
    console.error('Error generating quick interpretation:', error)
    throw new Error('Failed to generate interpretation')
  }
}
