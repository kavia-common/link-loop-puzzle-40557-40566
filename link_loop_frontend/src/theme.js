//
// Ocean Professional theme tokens and helpers
//

// PUBLIC_INTERFACE
export const theme = {
  // This file defines the Ocean Professional theme colors and sizing tokens.
  // Use CSS variables to allow live theming and easy overrides.
  colors: {
    primary: '#2563EB',
    secondary: '#F59E0B',
    success: '#F59E0B',
    error: '#EF4444',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    muted: '#6B7280',
    gridLine: '#E5E7EB',

    // New board/cell tokens
    boardSurface: '#ffffff',
    boardTintTop: 'rgba(37,99,235,0.08)',
    boardTintBottom: 'rgba(255,255,255,0.95)',
    cellBorder: '#D1D5DB',
    cellHover: 'rgba(37,99,235,0.06)',
    cellActive: 'rgba(37,99,235,0.14)',
    selectionRing: 'rgba(37,99,235,0.45)',
    cellAmber: 'rgba(245,158,11,0.16)',
    cellAmberBorder: 'rgba(245,158,11,0.55)'
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 10px 24px rgba(0,0,0,0.12)',
  },
  radius: {
    sm: '8px',
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
    '--c-secondary': colors.secondary,
    '--c-success': colors.success,
    '--c-error': colors.error,
    '--c-bg': colors.background,
    '--c-surface': colors.surface,
    '--c-text': colors.text,
    '--c-muted': colors.muted,
    '--c-grid': colors.gridLine,

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
