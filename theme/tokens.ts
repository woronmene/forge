/**
 * FORGE Design System v1.0 — TypeScript design tokens
 * Mirrors theme/*.css for programmatic use (charts, canvas, etc.)
 */

export const colors = {
  primary: "#2F4BFA",
  primary10: "#E6ECFF",

  success: {
    text: "#287F6E",
    bg: "#C6EDE5",
  },
  error: {
    text: "#F91010",
    bg: "#FED9D9",
  },
  warning: {
    text: "#F09706",
    bg: "#FEF3C7",
  },
  neutral: {
    text: "#737373",
    bg: "#F5F5F5",
  },

  text: {
    primary: "#0A0A0A",
    secondary: "#737373",
  },
  border: "#E5E5E5",
  surface: "#F6F7FB",
  background: "#FFFFFF",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const typography = {
  h1PageTitle: {
    fontWeight: fontWeights.semibold,
    fontSize: "20px",
    lineHeight: "28px",
  },
  h2SectionTitle: {
    fontWeight: fontWeights.semibold,
    fontSize: "16px",
    lineHeight: "24px",
  },
  h3CardTitle: {
    fontWeight: fontWeights.medium,
    fontSize: "16px",
    lineHeight: "24px",
  },
  bodyLarge: {
    fontWeight: fontWeights.regular,
    fontSize: "16px",
    lineHeight: "24px",
  },
  body: {
    fontWeight: fontWeights.regular,
    fontSize: "14px",
    lineHeight: "20px",
  },
  bodySmall: {
    fontWeight: fontWeights.regular,
    fontSize: "12px",
    lineHeight: "16px",
  },
  caption: {
    fontWeight: fontWeights.regular,
    fontSize: "11px",
    lineHeight: "16px",
  },
} as const;

export const fontFamily = {
  sans: [
    "SF Pro",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
} as const;
