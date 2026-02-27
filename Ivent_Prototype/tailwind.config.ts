import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(148,163,184,0.25), 0 18px 40px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
