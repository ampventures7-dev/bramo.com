import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Coastal Konkan Palette
        konkan: {
          teal: {
            50: "#f0fdfa",
            100: "#ccfbf1",
            200: "#99f6e4",
            300: "#5eead4",
            400: "#2dd4bf",
            500: "#14b8a6",
            600: "#0d9488",
            700: "#0f766e",
            800: "#115e59",
            900: "#134e4a",
            950: "#042f2e",
          },
          sand: {
            50: "#faf8f5",
            100: "#f5f0e8",
            200: "#ece1d1",
            300: "#dfcbb3",
            400: "#cfae90",
            500: "#c29370",
            600: "#b47f5b",
            700: "#96654a",
            800: "#7a5340",
            900: "#644537",
          },
          ocean: {
            50: "#f0f9ff",
            100: "#e0f2fe",
            200: "#bae6fd",
            500: "#0284c7",
            800: "#075985",
            900: "#0c4a6e",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
