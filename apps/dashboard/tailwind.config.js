/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      colors: {
        background: "#07070b",
        foreground: "#fafafa",
        zinc: {
          950: "#09090d",
          900: "#121218",
          850: "#181820",
          800: "#272730",
          750: "#3f3f4a",
          700: "#52525e",
        },
        pass: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#065F46",
        },
        fail: {
          DEFAULT: "#F43F5E",
          light: "#FFE4E6",
          dark: "#9F1239",
        },
        review: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#78350F",
        },
        conflicting: {
          DEFAULT: "#A855F7",
          light: "#F3E8FF",
          dark: "#581C87",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

