'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary for errors thrown in the root layout itself. It must
 * render its own <html>/<body> because the layout that normally provides them
 * is what failed. Kept dependency-free and inline-styled for the same reason.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error', error.digest ?? error.message)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0D16',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 360 }}>
          The app hit a fatal error. Please reload.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            borderRadius: 999,
            border: 'none',
            background: '#7c5cff',
            color: '#fff',
            padding: '10px 20px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </body>
    </html>
  )
}
