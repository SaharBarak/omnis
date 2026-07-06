import { ImageResponse } from 'next/og'

export const alt = 'OmnisX — Symbolic Life OS'
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
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '2px solid rgba(167, 143, 223, 0.18)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: '2px solid rgba(167, 143, 223, 0.3)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: '2px solid rgba(167, 143, 223, 0.45)',
            display: 'flex',
          }}
        />

        {/* Center dot */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#7D5BC9',
            marginBottom: 32,
            display: 'flex',
          }}
        />

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
          OmnisX
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
          OmnisX
        </div>
      </div>
    ),
    { ...size }
  )
}
