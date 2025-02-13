/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				'orange':'#e6805f'
			},
			keyframes: {
				dash: {
					'0%': { 'stroke-dashoffset': 820 },
					'100%': { 'stroke-dashoffset': 0 },
				},
			},
			animation: {
				dash: 'dash 2s ease-in-out'
			}
		},
	},
	plugins: [],
}
