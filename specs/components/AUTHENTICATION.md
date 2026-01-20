# Authentication Component Specification

## Overview

Authentication system providing secure user identity management with OAuth providers and optional email magic links.

---

## Authentication Methods

### Priority Order
1. **Google OAuth** — Primary (most Israeli users)
2. **Apple Sign In** — Secondary (iOS users, App Store requirement)
3. **Email Magic Link** — Fallback (no password)

---

## OAuth Flow

### Sequence Diagram
```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Client │     │ Backend │     │ Supabase │     │ Provider │
└───┬────┘     └────┬────┘     └────┬─────┘     └────┬─────┘
    │               │               │                │
    │ Click Login   │               │                │
    ├──────────────►│               │                │
    │               │ initiate()    │                │
    │               ├──────────────►│                │
    │               │               │ redirect URL   │
    │               │◄──────────────┤                │
    │ redirect      │               │                │
    │◄──────────────┤               │                │
    │               │               │                │
    │ ─────────────────────────────────────────────►│
    │               │               │    auth page   │
    │               │               │                │
    │◄─────────────────────────────────────────────┤
    │               │               │    callback    │
    │ callback URL  │               │                │
    ├──────────────►│               │                │
    │               │ exchange code │                │
    │               ├──────────────►│                │
    │               │               │ access token   │
    │               │◄──────────────┤                │
    │               │               │                │
    │ session token │               │                │
    │◄──────────────┤               │                │
    │               │               │                │
```

### Google OAuth Configuration
```typescript
interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: ['openid', 'email', 'profile'];
}

// Supabase handles the OAuth flow
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

### Apple Sign In Configuration
```typescript
interface AppleSignInConfig {
  clientId: string;        // Service ID
  redirectUri: string;
  scopes: ['name', 'email'];
}

// Apple requires special handling for name (only provided on first sign-in)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

---

## Email Magic Link

### Flow
```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌───────┐
│ Client │     │ Backend │     │ Supabase │     │ Email │
└───┬────┘     └────┬────┘     └────┬─────┘     └───┬───┘
    │               │               │               │
    │ enter email   │               │               │
    ├──────────────►│               │               │
    │               │ send link     │               │
    │               ├──────────────►│               │
    │               │               │ send email    │
    │               │               ├──────────────►│
    │ show message  │               │               │
    │◄──────────────┤               │               │
    │               │               │               │
    │    user clicks link in email  │               │
    │◄──────────────────────────────┤               │
    │               │               │               │
    │ token exchange│               │               │
    ├──────────────►│               │               │
    │               │ verify        │               │
    │               ├──────────────►│               │
    │               │◄──────────────┤               │
    │ session       │               │               │
    │◄──────────────┤               │               │
```

### Implementation
```typescript
async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw new AuthError('Failed to send magic link', error);
}
```

---

## Session Management

### JWT Structure
```typescript
interface JWTPayload {
  sub: string;          // User ID
  email: string;
  aud: string;          // Audience
  exp: number;          // Expiration timestamp
  iat: number;          // Issued at
  role: 'authenticated';
}
```

### Token Storage
```typescript
// Supabase handles token storage automatically
// Tokens stored in localStorage by default
// Can configure to use cookies for SSR

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### Session Lifecycle
```typescript
// Get current session
const { data: { session }, error } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      // User signed in
      break;
    case 'SIGNED_OUT':
      // User signed out
      break;
    case 'TOKEN_REFRESHED':
      // Token was refreshed
      break;
    case 'USER_UPDATED':
      // User data updated
      break;
  }
});

// Sign out
await supabase.auth.signOut();
```

---

## User Data Model

### Supabase Auth User
```typescript
// Managed by Supabase Auth
interface AuthUser {
  id: string;                    // UUID
  email: string;
  email_confirmed_at: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  app_metadata: {
    provider: string;            // 'google', 'apple', 'email'
    providers: string[];
  };
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    // Provider-specific data
  };
}
```

### Extended Profile (Custom Table)
```typescript
interface UserProfile {
  user_id: string;               // References auth.users.id
  display_name: string;
  avatar_url?: string;
  birth_date?: string;           // ISO date
  birth_time?: string;           // HH:MM
  birth_place?: BirthPlace;
  hebrew_name?: string;
  locale: 'he' | 'en';
  timezone: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface BirthPlace {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
```

---

## Onboarding Flow

### New User Flow
```
┌──────────────────┐
│  OAuth Success   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Check Profile   │────►│  Existing User   │
└────────┬─────────┘     └────────┬─────────┘
         │ new                    │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│  Create Profile  │     │    Dashboard     │
└────────┬─────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│   Onboarding     │
│  1. Name         │
│  2. Birth Date   │
│  3. Hebrew Name  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Dashboard     │
└──────────────────┘
```

### Onboarding Steps
```typescript
interface OnboardingState {
  step: 'name' | 'birthdate' | 'hebrew-name' | 'complete';
  data: Partial<UserProfile>;
}

// Step 1: Display name (from OAuth or manual)
// Step 2: Birth date (required for calculations)
// Step 3: Hebrew name (optional, for gematria)
```

---

## Protected Routes

### Route Guard
```typescript
// Web (Next.js middleware)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/app')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Auth routes (redirect if already logged in)
  if (req.nextUrl.pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/app', req.url));
    }
  }

  return res;
}
```

### Mobile Route Guard
```typescript
// Expo Router layout with auth check
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/');
    }
  }, [session, loading, segments]);

  return <Slot />;
}
```

---

## Error Handling

### Auth Errors
```typescript
type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_not_found'
  | 'provider_error'
  | 'session_expired'
  | 'network_error'
  | 'rate_limited';

interface AuthError {
  code: AuthErrorCode;
  message: string;
  originalError?: Error;
}

const authErrorMessages: Record<AuthErrorCode, string> = {
  invalid_credentials: 'פרטי ההתחברות שגויים',
  email_not_confirmed: 'יש לאשר את כתובת האימייל',
  user_not_found: 'משתמש לא נמצא',
  provider_error: 'שגיאה בספק ההתחברות',
  session_expired: 'תוקף ההתחברות פג',
  network_error: 'שגיאת רשת',
  rate_limited: 'יותר מדי ניסיונות, נסה שוב מאוחר יותר',
};
```

---

## Security Considerations

### PKCE Flow
Supabase uses PKCE (Proof Key for Code Exchange) for OAuth:
```typescript
// Automatically handled by Supabase client
// Generates code_verifier and code_challenge
// Prevents authorization code interception
```

### Row Level Security
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### Rate Limiting
```typescript
// Supabase has built-in rate limiting
// Additional rate limiting at API gateway level
const rateLimits = {
  signIn: { requests: 5, window: '15m' },
  magicLink: { requests: 3, window: '1h' },
  passwordReset: { requests: 3, window: '1h' },
};
```

---

## API Endpoints

### Auth Routes
```
GET  /auth/callback           # OAuth callback handler
POST /auth/signout            # Sign out (clear session)
GET  /auth/session            # Get current session
POST /auth/refresh            # Refresh access token
```

### Profile Routes
```
GET  /api/profile             # Get user profile
POST /api/profile             # Create profile (onboarding)
PATCH /api/profile            # Update profile
DELETE /api/profile           # Delete account
```

---

## Account Deletion

### GDPR Compliance
```typescript
async function deleteAccount(userId: string): Promise<void> {
  // 1. Delete all user data
  await supabase.from('people').delete().eq('owner_id', userId);
  await supabase.from('computed_results').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('user_id', userId);

  // 2. Delete auth user (requires service role)
  await supabaseAdmin.auth.admin.deleteUser(userId);

  // 3. Sign out current session
  await supabase.auth.signOut();
}
```

### Data Export
```typescript
async function exportUserData(userId: string): Promise<UserDataExport> {
  const profile = await supabase.from('profiles').select().eq('user_id', userId).single();
  const people = await supabase.from('people').select().eq('owner_id', userId);
  const results = await supabase.from('computed_results').select().eq('user_id', userId);

  return {
    profile: profile.data,
    people: people.data,
    computedResults: results.data,
    exportedAt: new Date().toISOString(),
  };
}
```

---

## UI Components

### Login Page
```
┌─────────────────────────────────────────┐
│                                         │
│              [Logo]                     │
│              Omnis                      │
│                                         │
│     ────────────────────────────        │
│                                         │
│     ┌───────────────────────────┐       │
│     │  🔵 התחבר עם Google       │       │
│     └───────────────────────────┘       │
│                                         │
│     ┌───────────────────────────┐       │
│     │  🍎 התחבר עם Apple        │       │
│     └───────────────────────────┘       │
│                                         │
│     ─────────── או ───────────          │
│                                         │
│     ┌───────────────────────────┐       │
│     │  📧 your@email.com        │       │
│     └───────────────────────────┘       │
│     ┌───────────────────────────┐       │
│     │       שלח קישור           │       │
│     └───────────────────────────┘       │
│                                         │
│     בהתחברות אתה מסכים ל                │
│     [תנאי שימוש] ו[מדיניות פרטיות]     │
│                                         │
└─────────────────────────────────────────┘
```

### Auth State Hook
```typescript
interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

function useAuth(): UseAuthReturn {
  // Implementation
}
```
