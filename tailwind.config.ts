import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			display: [
  				'var(--font-display)',
  				'Space Grotesk',
  				'system-ui',
  				'sans-serif'
  			],
  			sans: [
  				'var(--font-sans)',
  				'Barlow',
  				'system-ui',
  				'sans-serif'
  			],
  			heading: [
  				'var(--font-heading)',
  				'Rubik',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'IBM Plex Mono',
  				'monospace'
  			]
  		},
  		fontSize: {
  			xs: ['0.75rem', { lineHeight: '1rem' }],
  			sm: ['0.875rem', { lineHeight: '1.25rem' }],
  			base: ['1rem', { lineHeight: '1.6' }],
  			lg: ['1.125rem', { lineHeight: '1.7' }],
  			xl: ['1.25rem', { lineHeight: '1.6' }],
  			'2xl': ['1.5rem', { lineHeight: '1.4' }],
  			'3xl': ['1.875rem', { lineHeight: '1.3' }],
  			'4xl': ['2.25rem', { lineHeight: '1.2' }],
  			'5xl': ['3rem', { lineHeight: '1.1' }],
  			'6xl': ['3.75rem', { lineHeight: '1.05' }],
  			'7xl': ['4.5rem', { lineHeight: '1' }],
  			'8xl': ['6rem', { lineHeight: '0.95' }],
  			'9xl': ['7rem', { lineHeight: '0.9' }]
  		},
  		colors: {
  			ground: '#0B0D16',
  			surface: {
  				DEFAULT: '#0D101A',
  				'2': '#12151F'
  			},
  			brand: {
  				DEFAULT: '#7D5BC9',
  				soft: '#A78FDF',
  				bright: '#EFEAFA'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			seal: {
  				red: 'hsl(var(--seal-red))',
  				white: 'hsl(var(--seal-white))',
  				blue: 'hsl(var(--seal-blue))',
  				yellow: 'hsl(var(--seal-yellow))'
  			},
  			earth: 'hsl(var(--earth))',
  			clay: 'hsl(var(--clay))',
  			terracotta: 'hsl(var(--terracotta))',
  			sand: 'hsl(var(--sand))',
  			parchment: 'hsl(var(--parchment))',
  			sage: 'hsl(var(--sage))',
  			forest: 'hsl(var(--forest))',
  			indigo: 'hsl(var(--indigo))',
  			midnight: 'hsl(var(--midnight))',
  			amber: 'hsl(var(--amber))',
  			cream: 'hsl(var(--cream))',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: '0.5rem',
  			'2xl': '0.625rem',
  			'3xl': '0.75rem'
  		},
  		spacing: {
  			'18': '4.5rem',
  			'22': '5.5rem'
  		},
  		maxWidth: {
  			'content': '1180px',
  		},
  		boxShadow: {
  			// Flat design — minimal shadows, no purple tinting
  			'subtle': '0 1px 2px rgba(0, 0, 0, 0.04)',
  			'elevated': '0 2px 8px rgba(0, 0, 0, 0.06)',
  			'float': '0 4px 12px rgba(0, 0, 0, 0.08)',
  			'glow': '0 0 0 2px hsl(257 55% 50% / 0.15)',
  			'inner-subtle': 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
  			'none': 'none',
  			// Legacy aliases
  			'earth': '0 1px 2px rgba(0, 0, 0, 0.04)',
  			'earth-md': '0 2px 8px rgba(0, 0, 0, 0.06)',
  			'earth-lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
  			'inner-earth': 'inset 0 1px 2px rgba(0, 0, 0, 0.04)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-out forwards',
  			'fade-up': 'fadeUp 0.4s ease-out forwards',
  			'fade-down': 'fadeDown 0.35s ease-out forwards',
  			'slide-up': 'slideUp 0.3s ease-out forwards',
  			'slide-in-right': 'slideInRight 0.35s ease-out forwards',
  			'slide-in-left': 'slideInLeft 0.35s ease-out forwards',
  			'scale-in': 'scaleIn 0.3s ease-out forwards',
  			'scale-up': 'scaleUp 0.4s ease-out forwards',
  			'gentle-pulse': 'gentlePulse 2.5s ease-in-out infinite',
  			'shimmer': 'shimmer 2s linear infinite',
  			'float': 'float 3s ease-in-out infinite',
  			'breathe': 'breathe 4s ease-in-out infinite',
  			'spin-slow': 'spin-slow 20s linear infinite',
  			'gradient': 'gradient-shift 6s ease infinite',
  			'reveal-line': 'reveal-line 0.8s ease-out forwards',
  			'blur-in': 'blur-in 0.5s ease-out forwards',
  			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			fadeUp: {
  				'0%': { opacity: '0', transform: 'translateY(12px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			fadeDown: {
  				'0%': { opacity: '0', transform: 'translateY(-8px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			slideUp: {
  				'0%': { opacity: '0', transform: 'translateY(100%)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			slideInRight: {
  				'0%': { opacity: '0', transform: 'translateX(16px)' },
  				'100%': { opacity: '1', transform: 'translateX(0)' }
  			},
  			slideInLeft: {
  				'0%': { opacity: '0', transform: 'translateX(-16px)' },
  				'100%': { opacity: '1', transform: 'translateX(0)' }
  			},
  			scaleIn: {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			},
  			scaleUp: {
  				'0%': { opacity: '0', transform: 'scale(0.9)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			},
  			gentlePulse: {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.6' }
  			},
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' }
  			},
  			float: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-6px)' }
  			},
  			breathe: {
  				'0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
  				'50%': { transform: 'scale(1.03)', opacity: '1' }
  			},
  			'spin-slow': {
  				'0%': { transform: 'rotate(0deg)' },
  				'360%': { transform: 'rotate(360deg)' }
  			},
  			'gradient-shift': {
  				'0%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  				'100%': { backgroundPosition: '0% 50%' }
  			},
  			'reveal-line': {
  				'0%': { width: '0' },
  				'100%': { width: '100%' }
  			},
  			'blur-in': {
  				'0%': { opacity: '0', filter: 'blur(8px)' },
  				'100%': { opacity: '1', filter: 'blur(0)' }
  			},
  			'glow-pulse': {
  				'0%, 100%': { boxShadow: '0 0 0 0 hsl(257 55% 50% / 0)' },
  				'50%': { boxShadow: '0 0 20px 4px hsl(257 55% 50% / 0.15)' }
  			},
  		},
  		transitionTimingFunction: {
  			'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  			'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  		},
  		transitionDuration: {
  			'fast': '120ms',
  			'normal': '200ms',
  			'slow': '300ms',
  			'slower': '500ms',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
