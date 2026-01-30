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
  			sans: [
  				'Source Sans 3',
  				'system-ui',
  				'sans-serif'
  			],
  			heading: [
  				'Cormorant Garamond',
  				'Georgia',
  				'serif'
  			],
  			mono: [
  				'IBM Plex Mono',
  				'monospace'
  			]
  		},
  		fontSize: {
  			xs: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'1rem',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			lg: [
  				'1.125rem',
  				{
  					lineHeight: '1.7'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '1.4'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '1.3'
  				}
  			],
  			'4xl': [
  				'2.25rem',
  				{
  					lineHeight: '1.2'
  				}
  			],
  			'5xl': [
  				'3rem',
  				{
  					lineHeight: '1.15'
  				}
  			],
  			'6xl': [
  				'3.75rem',
  				{
  					lineHeight: '1.1'
  				}
  			],
  			'7xl': [
  				'4.5rem',
  				{
  					lineHeight: '1.05'
  				}
  			]
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
  			xl: '0.875rem',
  			'2xl': '1rem',
  			'3xl': '1.5rem'
  		},
  		spacing: {
  			'18': '4.5rem',
  			'22': '5.5rem'
  		},
  		boxShadow: {
  			earth: '0 1px 3px rgba(45, 37, 25, 0.06), 0 4px 12px rgba(45, 37, 25, 0.04)',
  			'earth-md': '0 2px 6px rgba(45, 37, 25, 0.08), 0 8px 24px rgba(45, 37, 25, 0.06)',
  			'earth-lg': '0 4px 12px rgba(45, 37, 25, 0.1), 0 16px 48px rgba(45, 37, 25, 0.08)',
  			'inner-earth': 'inset 0 1px 2px rgba(45, 37, 25, 0.06)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-out',
  			'fade-up': 'fadeUp 0.6s ease-out forwards',
  			'slide-up': 'slideUp 0.6s ease-out',
  			'gentle-pulse': 'gentlePulse 3s ease-in-out infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			fadeUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(16px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			gentlePulse: {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.7'
  				}
  			}
  		},
  		transitionDuration: {
  			fast: '150ms',
  			normal: '200ms',
  			slow: '300ms'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
