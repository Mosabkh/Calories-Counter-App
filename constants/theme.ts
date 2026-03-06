export const Theme = {
  colors: {
    background: '#FFFAF5',
    surface: '#FFFFFF',
    primary: '#E2856E',
    primaryHover: '#C76750',
    secondary: '#F4B39D',
    accentBackground: '#FCE1D4',
    textDark: '#543128',
    textMuted: '#936255',
    border: 'rgba(226, 133, 110, 0.2)',
    success: '#7B9E87',
    warning: '#E0B05C',
    calorieAlert: '#D65A4F',
    infoBlue: '#4AA0E0',
  },
  fonts: {
    regular: 'Nunito_400Regular',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
  },
  borderRadius: {
    card: 20,
    screen: 35,
    button: 20,
  },
} as const;
