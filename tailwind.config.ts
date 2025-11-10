// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // This 'content' array tells Tailwind where to look for class names
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // You can change these hex codes
        primary: "#0070f3", // Used for buttons, links
        secondary: "#64748b", // Used for "Add" button
      },
    },
  },
  plugins: [],
};
export default config;