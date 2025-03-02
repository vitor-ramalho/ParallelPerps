/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  daisyui: {
    themes: [
      {
        light: {
          backgroundImage: {
            "custom-gradient": "linear-gradient(to bottom, #7f5af0, #1a083d)",
          },
          primary: "#846ff8", // monad purple
          "primary-content": "#010100", // black
          secondary: "#9f8dfe",
          "secondary-content": "#010100", // black
          accent: "#a1055c", // berry
          "accent-content": "#fefffe", // white
          neutral: "#1e2936", // grey
          "neutral-content": "#fefffe", // white
          "base-100": "#fefffe", // white
          "base-200": "#f0f1f0", // white 80
          "base-300": "#e3e2e3", // white 60
          "base-content": "#010100", // black
          info: "#a1c3ff", // info
          success: "#2da67b", // success
          warning: "#fbc657", // warning
          error: "#f70e0e", // error
          "--rounded-btn": "9999rem",
          ".tooltip": { "--tooltip-tail": "6px" },
          ".link": { textUnderlineOffset: "2px" },
          ".link:hover": { opacity: "80%" },
        },
      },
      {
        dark: {
          primary: "#846ff8", // monad purple
          "primary-content": "#fefffe", // white
          secondary: "#9f8dfe", // electric ice
          "secondary-content": "#fefffe", // white
          accent: "#a1055c", // berry
          "accent-content": "#fefffe", // white
          neutral: "#1e2936", // grey
          "neutral-content": "#fefffe", // white
          "base-100": "#200152", // monad dark blue
          "base-200": "#3c1b85", // purple dark 50
          "base-300": "#1a0f63", // blue dark 50
          "base-content": "#fefffe", // white
          info: "#a1c3ff", // info
          success: "#2da67b", // success
          warning: "#fbc657", // warning
          error: "#f70e0e", // error
          "--rounded-btn": "9999rem",
          ".tooltip": { "--tooltip-tail": "6px", "--tooltip-color": "oklch(var(--p))" },
          ".link": { textUnderlineOffset: "2px" },
          ".link:hover": { opacity: "80%" },
        },
      },
    ],
  },
  theme: {
    extend: {
      boxShadow: { center: "0 0 12px -2px rgb(0 0 0 / 0.05)" },
      animation: { "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
    },
  },
};
