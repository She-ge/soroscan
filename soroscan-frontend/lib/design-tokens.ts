/**
 * SoroScan design tokens — single source for CSS variable names & JS values.
 * Keep in sync with `app/globals.css` (@theme / :root).
 */

export const colors = {
  black: "#0a0e27",
  dark: "#1a1f3a",
  medium: "#2d3748",
  green: "#00ff41",
  cyan: "#00d4ff",
  danger: "#ff3366",
  warning: "#ffaa00",
  info: "#38bdf8",
  success: "#00ff41",
  /** AA+AAA on terminal black (7.41:1). Replaces legacy #64748b. */
  gray: "#94a3b8",
  /** Legacy muted — decorative / non-text only (<4.5:1). */
  grayMuted: "#64748b",
  light: "#e2e8f0",
  white: "#f8fafc",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

export const typography = {
  h1: { size: 32, weight: 600, leading: 1.25, family: "mono" as const },
  h2: { size: 24, weight: 600, leading: 1.3, family: "mono" as const },
  h3: { size: 18, weight: 600, leading: 1.35, family: "sans" as const },
  body: { size: 14, weight: 400, leading: 1.55, family: "sans" as const },
  caption: { size: 12, weight: 400, leading: 1.4, family: "sans" as const },
} as const;

export const controlHeights = {
  sm: 36,
  md: 44,
  lg: 48,
  touchMin: 44,
} as const;

export const glows = {
  green: "0 0 16px rgba(0, 255, 65, 0.45), 0 0 4px rgba(0, 255, 65, 0.35)",
  cyan: "0 0 16px rgba(0, 212, 255, 0.45), 0 0 4px rgba(0, 212, 255, 0.35)",
  danger: "0 0 16px rgba(255, 51, 102, 0.4), 0 0 4px rgba(255, 51, 102, 0.3)",
  warning: "0 0 16px rgba(255, 170, 0, 0.4), 0 0 4px rgba(255, 170, 0, 0.3)",
  card: "0 0 20px rgba(0, 255, 65, 0.1)",
} as const;

/** Documented WCAG contrast ratios vs terminal black (#0a0e27). */
export const contrastRatios = {
  green: 13.92,
  cyan: 10.73,
  danger: 5.36,
  warning: 9.96,
  gray: 7.41,
  grayMuted: 3.99,
  info: 8.87,
  light: 15.42,
  white: 18.16,
} as const;

export type SemanticTone = "success" | "warning" | "error" | "info";

export const semanticColors: Record<SemanticTone, string> = {
  success: colors.success,
  warning: colors.warning,
  error: colors.danger,
  info: colors.info,
};

/**
 * Dashboard layout & information architecture tokens (#910).
 * Desktop reference: 1920px. Mobile reference: 375px.
 */
export const layout = {
  /** App chrome */
  headerHeight: 60,
  navSidebarWidth: 240,
  /** Event Explorer filter column (desktop) */
  filterSidebarWidth: 280,
  /** Content gutters */
  pagePaddingDesktop: 24,
  pagePaddingMobile: 16,
  /** Breakpoints matching Tailwind sm/md/lg */
  breakpoints: {
    mobileMax: 639,
    tabletMin: 640,
    desktopMin: 1024,
    wideMin: 1280,
  },
  /** Card / panel hierarchy */
  panel: {
    borderWidth: 1,
    radius: 2,
    padding: 16,
    gap: 16,
    shadow: "0 0 20px rgba(0, 255, 65, 0.1)",
    elevatedShadow:
      "0 0 24px rgba(0, 255, 65, 0.16), 0 0 4px rgba(0, 255, 65, 0.2)",
  },
  /** Data table density */
  table: {
    headerHeight: 40,
    rowHeight: 48,
    rowHeightCompact: 40,
    cellPaddingX: 12,
    cellPaddingY: 10,
    minWidth: 680,
    columns: {
      select: 44,
      contract: 160,
      type: 120,
      ledger: 96,
      time: 140,
      tags: 160,
      actions: 88,
    },
  },
  /** Admin dashboard grid */
  admin: {
    metricsColumns: 4,
    chartMainSpan: 2,
    chartSideSpan: 1,
    sectionGap: 24,
  },
} as const;
