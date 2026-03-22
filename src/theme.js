export const theme = {
  colors: {
    primary: '#f97316',
    primaryHover: '#ea6c0a',
    primaryLight: '#fff7ed',
    background: '#fafaf9',
    surface: '#ffffff',
    surfaceWarm: '#fffbf7',
    border: '#e8e0d8',
    borderLight: '#f0ebe4',
    text: '#1c1917',
    textSecondary: '#78716c',
    textMuted: '#a8a29e',
    success: '#16a34a',
    successLight: '#f0fdf4',
    warning: '#d97706',
    warningLight: '#fffbeb',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    pending: '#d97706',
    approved: '#16a34a',
    rejected: '#dc2626',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 24px rgba(0,0,0,0.10)',
  },
  font: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  }
}

export const statusColor = {
  pending: theme.colors.pending,
  approved: theme.colors.approved,
  rejected: theme.colors.rejected,
}

export const statusBg = {
  pending: theme.colors.warningLight,
  approved: theme.colors.successLight,
  rejected: theme.colors.dangerLight,
}