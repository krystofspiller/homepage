/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-accent": "linear-gradient(45deg, #e6c75f, #e65f5f)",
        "light-glow-accent":
          "radial-gradient(#e6815f30, transparent 70%, transparent)",
      },
      colors: {
        orange: "#e6805f",
      },
      keyframes: {
        dash: {
          "0%": { "stroke-dashoffset": 820 },
          "100%": { "stroke-dashoffset": 0 },
        },
        wave: {
          "0%": { transform: "rotate(0)" },
          "12.5%": { transform: "rotate(12deg)" },
          "37.5%": { transform: "rotate(-12deg)" },
          "62.5%": { transform: "rotate(12deg)" },
          "87.5%": { transform: "rotate(-12deg)" },
          "100%": { transform: "rotate(0)" },
        },
      },
      animation: {
        dash: "dash 2s ease-in-out",
        wave: "wave 2s linear",
        "wave-infinite": "wave 2s linear infinite",
      },
    },
  },
  plugins: [],
}
