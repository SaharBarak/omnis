import { ImageResponse } from 'next/og'

export const alt = 'Pleiad — Symbolic Life OS'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0B0D16 0%, #131625 50%, #0B0D16 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Asterism mark */}
        <svg
          viewBox="0 0 32 32"
          width="140"
          height="140"
          style={{ marginBottom: 32 }}
        >
          <g stroke="#A78FDF" strokeWidth="0.9" opacity="0.55">
            <line x1="16" y1="16" x2="7" y2="9" />
            <line x1="16" y1="16" x2="25" y2="7" />
            <line x1="16" y1="16" x2="24" y2="24" />
            <line x1="16" y1="16" x2="8" y2="25" />
            <line x1="7" y1="9" x2="25" y2="7" />
          </g>
          <circle cx="16" cy="16" r="3.4" fill="#7D5BC9" />
          <circle cx="7" cy="9" r="2" fill="#EFEAFA" />
          <circle cx="25" cy="7" r="1.6" fill="#A78FDF" />
          <circle cx="24" cy="24" r="1.8" fill="#A78FDF" />
          <circle cx="8" cy="25" r="1.4" fill="#EFEAFA" />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          Pleiad
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 40,
            display: 'flex',
          }}
        >
          Symbolic Life OS
        </div>

        {/* System names */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}
        >
          {['Dreamspell', 'Tzolkin', 'Long Count', 'Human Design', 'Astrology', 'Kabbalah'].map(
            (name) => (
              <div
                key={name}
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  display: 'flex',
                }}
              >
                {name}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: 'rgba(167, 143, 223, 0.8)',
            display: 'flex',
          }}
        >
          Pleiad
        </div>
      </div>
    ),
    { ...size }
  )
}
