/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "dot-pulse": {
          "0%, 100%": { transform: "scale(1) translateY(0)" },
          "25%": { transform: "scale(1.15) translateY(-6px)" },
          "50%": { transform: "scale(1) translateY(0)" },
          "75%": { transform: "scale(1.1) translateY(-4px)" },
        },
        "dot-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "20%": { transform: "translateY(-12px)" },
          "40%": { transform: "translateY(0)" },
          "60%": { transform: "translateY(-8px)" },
          "80%": { transform: "translateY(0)" },
        },
        "dot-shake": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "15%": { transform: "translateX(-5px) rotate(-8deg)" },
          "30%": { transform: "translateX(5px) rotate(8deg)" },
          "45%": { transform: "translateX(-4px) rotate(-5deg)" },
          "60%": { transform: "translateX(4px) rotate(5deg)" },
          "75%": { transform: "translateX(-2px) rotate(-2deg)" },
        },
        "dot-wiggle": {
          "0%, 100%": { transform: "rotate(0deg) translateY(0)" },
          "20%": { transform: "rotate(-12deg) translateY(-3px)" },
          "40%": { transform: "rotate(12deg) translateY(-3px)" },
          "60%": { transform: "rotate(-8deg) translateY(-2px)" },
          "80%": { transform: "rotate(8deg) translateY(-2px)" },
        },
        "dot-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "30%": { transform: "translateY(-6px) rotate(-3deg)" },
          "60%": { transform: "translateY(-2px) rotate(3deg)" },
        },
        "dot-think": {
          "0%, 100%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "30%": { opacity: "0.6", transform: "scale(0.92) translateY(2px)" },
          "60%": { opacity: "1", transform: "scale(1.05) translateY(-4px)" },
        },
        "bubble-in": {
          "0%": { opacity: "0", transform: "scale(0.5) translateY(8px)" },
          "60%": { opacity: "1", transform: "scale(1.05) translateY(-2px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "bubble-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "dot-pulse": "dot-pulse 0.8s ease-in-out infinite",
        "dot-bounce": "dot-bounce 0.7s ease-in-out infinite",
        "dot-shake": "dot-shake 0.5s ease-in-out infinite",
        "dot-wiggle": "dot-wiggle 0.6s ease-in-out infinite",
        "dot-float": "dot-float 2.5s ease-in-out infinite",
        "dot-think": "dot-think 1.5s ease-in-out infinite",
        "bubble-in": "bubble-in 0.4s ease-out",
        "bubble-out": "bubble-out 0.3s ease-in forwards",
      },
    },
  },
  plugins: [],
}
