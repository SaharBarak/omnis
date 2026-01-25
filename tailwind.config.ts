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
  			sans: ['Inter', 'Heebo', 'system-ui', 'sans-serif'],
  			heading: ['Cinzel', 'Heebo', 'serif'],
  			mono: ['JetBrains Mono', 'monospace'],
  			hebrew: ['Heebo', 'Assistant', 'system-ui', 'sans-serif'],
  		},
  		fontSize: {
  			// Typography scale (1.25 ratio - Major Third)
  			'xs': ['0.75rem', { lineHeight: '1rem' }],        // 12px
  			'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
  			'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px
  			'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
  			'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
  			'2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
  			'3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
  			'4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
  			'5xl': ['3rem', { lineHeight: '1.2' }],           // 48px
  			'6xl': ['3.75rem', { lineHeight: '1.1' }],        // 60px
  		},
  		colors: {
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
  			// Seal colors
  			seal: {
  				red: 'hsl(var(--seal-red))',
  				white: 'hsl(var(--seal-white))',
  				blue: 'hsl(var(--seal-blue))',
  				yellow: 'hsl(var(--seal-yellow))',
  			},
  			// Gold accent
  			gold: {
  				DEFAULT: 'hsl(var(--gold))',
  				dark: 'hsl(var(--gold-dark))',
  			},
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			// Additional spacing values
  			'18': '4.5rem',
  			'22': '5.5rem',
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			slideUp: {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			pulseSoft: {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.7' },
  			},
  		},
  		transitionDuration: {
  			'fast': '150ms',
  			'normal': '200ms',
  			'slow': '300ms',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
