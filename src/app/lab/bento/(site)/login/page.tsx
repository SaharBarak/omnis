import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { Skeleton } from '@/components/bento-lab/site'

export const metadata: Metadata = { title: 'Sign in' }

/** T8 Auth. The form reads `redirectTo` from the URL, so it renders inside Suspense. */
export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton height={520} style={{ maxWidth: 440, margin: '48px auto' }} />}>
      <LoginForm />
    </Suspense>
  )
}
