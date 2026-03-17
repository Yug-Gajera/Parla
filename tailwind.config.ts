import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'var(--color-bg)',
				surface: 'var(--color-surface)',
				card: {
					DEFAULT: 'var(--color-card)',
					hover: 'var(--color-card-hover)',
				},
				border: {
					DEFAULT: 'var(--color-border)',
					strong: 'var(--color-border-strong)',
				},
				text: {
					primary: 'var(--color-text-primary)',
					secondary: 'var(--color-text-secondary)',
					muted: 'var(--color-text-muted)',
					disabled: 'var(--color-text-disabled)',
				},
				accent: {
					DEFAULT: 'var(--color-accent)',
					hover: 'var(--color-accent-hover)',
					subtle: 'var(--color-accent-subtle)',
					border: 'var(--color-accent-border)',
				},
				gold: {
					DEFAULT: 'var(--color-gold)',
					subtle: 'var(--color-gold-subtle)',
					border: 'var(--color-gold-border)',
				},
				success: {
					DEFAULT: 'var(--color-success)',
					subtle: 'var(--color-success-subtle)',
				},
				warning: {
					DEFAULT: 'var(--color-warning)',
					subtle: 'var(--color-warning-subtle)',
				},
				error: {
					DEFAULT: 'var(--color-error)',
					subtle: 'var(--color-error-subtle)',
				},
			},
			borderRadius: {
				'micro': '4px',
				'sm': '6px',
				'md': '10px',
				'lg': '14px',
				'xl': '20px',
				'pill': '9999px',
			},
			spacing: {
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
				'24': '96px',
			},
			fontFamily: {
				sans: ['var(--font-dm-sans)'],
				serif: ['var(--font-cormorant-garamond)'],
				mono: ['var(--font-jetbrains-mono)'],
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;
