import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { magicLink } from 'better-auth/plugins'
import { Resend } from 'resend'
import { mongoClient, mongoDb } from '@/lib/db/mongo-client'
import { connectMongo } from '@/lib/db/connection'
import { Profile } from '@/lib/db/models'

const FROM_EMAIL = 'Omnis <noreply@omnis.app>'

const siteUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

/** Build social providers only for the credentials that are configured. */
function socialProviders(): BetterAuthOptions['socialProviders'] {
  const providers: NonNullable<BetterAuthOptions['socialProviders']> = {}
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
  }
  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_CLIENT_SECRET
  ) {
    providers.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }
  }
  return providers
}

async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured; magic link URL:', url)
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Omnis sign-in link',
    html: `<p>Click to sign in to Omnis:</p><p><a href="${url}">Sign in</a></p><p>This link expires shortly. If you did not request it, ignore this email.</p>`,
  })
}

/**
 * Create the app's `profiles` document the first time a Better Auth user is
 * created. Replaces the profile bootstrap that lived in the Supabase OAuth
 * callback. Honors Mongoose schema defaults (locale, timezone, etc.).
 */
async function createProfileForUser(user: {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}): Promise<void> {
  try {
    await connectMongo()
    const existing = await Profile.findOne({ user_id: user.id }).lean()
    if (existing) return
    const displayName =
      user.name || user.email?.split('@')[0] || 'User'
    await Profile.create({
      user_id: user.id,
      display_name: displayName,
      avatar_url: user.image ?? null,
      onboarding_completed: false,
    })
  } catch (error) {
    console.error('Failed to create profile for user', user.id, error)
  }
}

export const auth = betterAuth({
  baseURL: siteUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(mongoDb, { client: mongoClient }),
  emailAndPassword: { enabled: false },
  socialProviders: socialProviders(),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url)
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createProfileForUser(user)
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
