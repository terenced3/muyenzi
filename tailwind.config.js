const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    heroui({
      addCommonColors: true,
      defaultTheme: "light",
      defaultExtendTheme: "light",
      themes: {
        light: {
          extend: "light",
          colors: {
            background: "#f4f5f9",
            foreground: "#11181C",
            focus: "#6366f1",
            primary: {
              50: "#eef2ff",
              100: "#e0e7ff",
              200: "#c7d2fe",
              300: "#a5b4fc",
              400: "#818cf8",
              500: "#6366f1",
              600: "#4f46e5",
              700: "#4338ca",
              800: "#3730a3",
              900: "#312e81",
              DEFAULT: "#6366f1",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#7c3aed",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#10b981",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#f59e0b",
              foreground: "#ffffff",
            },
            danger: {
              DEFAULT: "#ef4444",
              foreground: "#ffffff",
            },
            content1: "#ffffff",
            content2: "#f4f5f9",
            content3: "#eaecf3",
            content4: "#dde0eb",
          },
        },
        dark: {
          extend: "dark",
          colors: {
            background: "#0d0d1c",
            foreground: "#e8eaff",
            focus: "#818cf8",
            primary: {
              DEFAULT: "#818cf8",
              foreground: "#0d0d1c",
            },
            secondary: {
              DEFAULT: "#a78bfa",
              foreground: "#0d0d1c",
            },
            content1: "#13131f",
            content2: "#1a1a2e",
            content3: "#21213a",
            content4: "#282847",
          },
        },
      },
    }),
  ],
};
