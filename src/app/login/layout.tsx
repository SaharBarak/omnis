import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In to Omnis',
  description: 'Sign in to your Omnis account to access your cosmic blueprint, saved profiles, and personalized readings.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://omnis.app/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
