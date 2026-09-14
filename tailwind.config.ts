import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        surface: "hsl(var(--surface))",
        canvas: "hsl(var(--canvas))",
        line: "hsl(var(--line))",
        accent: "hsl(var(--accent))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
      },
      boxShadow: {
        panel: "0 12px 30px -24px rgba(15, 23, 42, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
