import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class", "class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					hover: '#171717',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: '#d4b460',
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
					foreground: 'hsl(var(--accent-foreground))',
					gold: '#c9a84c',
					'gold-light': '#e4c76b',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: '#4ade80',
				warning: '#fb923c',
				border: 'hsl(var(--border))',
				'border-strong': '#2a2a2a',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				surface: '#0f0f0f',
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				'xs': '4px',
				'sm': '6px',
				'md': '10px',
				'lg': '14px',
				'xl': '20px',
				'pill': '9999px',
			},
			spacing: {
				'0.5': '2px',
				'1': '4px',
				'2': '8px',
				'3': '12px',
				'4': '16px',
				'5': '20px',
				'6': '24px',
				'8': '32px',
				'10': '40px',
				'12': '48px',
				'16': '64px',
				'20': '80px',
			},
			fontFamily: {
				sans: ['var(--font-dm-sans)'],
				serif: ['var(--font-cormorant-garamond)'],
				cormorant: ['var(--font-cormorant-garamond)'],
				mono: ['var(--font-jetbrains-mono)'],
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;
