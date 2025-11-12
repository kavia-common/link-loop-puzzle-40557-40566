//
// Ocean Professional theme tokens and helpers (High Contrast Light Refresh)
//

// PUBLIC_INTERFACE
export const theme = {
  // This file defines the Ocean Professional theme colors and sizing tokens.
  // Use CSS variables to allow live theming and easy overrides.
  colors: {
    primary: '#2563EB',
    primary600: '#1D4ED8',
    secondary: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    background: '#F8FAFD',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    text: '#111827',
    muted: '#374151',
    gridLine: '#E5E7EB',
    border: '#D1D5DB',

    // Board/cell tokens for light theme
    boardSurface: '#FFFFFF',
    boardTintTop: 'rgba(37,99,235,0.04)',
    boardTintBottom: 'rgba(249,250,251,1)',
    cellBorder: '#D1D5DB',
    cellHover: 'rgba(37,99,235,0.06)',
    cellActive: 'rgba(37,99,235,0.10)',
    selectionRing: 'rgba(29,78,216,0.70)',
    cellAmber: 'rgba(245,158,11,0.10)',
    cellAmberBorder: 'rgba(245,158,11,0.75)'
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 10px rgba(0,0,0,0.08)',
    lg: '0 10px 24px rgba(0,0,0,0.12)',
  },
  radius: {
    sm: '10px',
    md: '12px',
    lg: '16px',
    xl: '20px'
  },
  transition: {
    base: 'all 200ms ease',
    fast: 'all 120ms ease'
  }
};

// PUBLIC_INTERFACE
export function applyThemeToDocument(doc = document, vars = theme) {
  /** Apply CSS variables to the root for theming. */
  const root = doc.documentElement;
  const { colors } = vars;
  Object.entries({
    '--c-primary': colors.primary,
    '--c-primary-600': colors.primary600,
    '--c-secondary': colors.secondary,
    '--c-success': colors.success,
    '--c-error': colors.error,
    '--c-bg': colors.background,
    '--c-surface': colors.surface,
    '--c-surface-alt': colors.surfaceAlt,
    '--c-text': colors.text,
    '--c-muted': colors.muted,
    '--c-grid': colors.gridLine,
    '--c-border': colors.border,

    // Additional board/cell variables
    '--board-surface': colors.boardSurface,
    '--board-tint-top': colors.boardTintTop,
    '--board-tint-bottom': colors.boardTintBottom,
    '--cell-border': colors.cellBorder,
    '--cell-hover-bg': colors.cellHover,
    '--cell-active-bg': colors.cellActive,
    '--cell-focus-ring': colors.selectionRing,
    '--cell-amber': colors.cellAmber,
    '--cell-amber-border': colors.cellAmberBorder,

    '--shadow-sm': theme.shadow.sm,
    '--shadow-md': theme.shadow.md,
    '--shadow-lg': theme.shadow.lg,
    '--radius-sm': theme.radius.sm,
    '--radius-md': theme.radius.md,
    '--radius-lg': theme.radius.lg,
    '--radius-xl': theme.radius.xl,
    '--transition-base': theme.transition.base,
    '--transition-fast': theme.transition.fast
  }).forEach(([k, v]) => root.style.setProperty(k, v));
}
