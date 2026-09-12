/**
 * Design tokens for PS 26034 Inspector App.
 * Based on iOS system colours for native feel.
 */
export const Colors = {
  // Primary
  primary: '#0A84FF',
  primaryDark: '#0060D0',

  // Decision outcomes
  pass: '#30D158',
  fail: '#FF453A',
  review: '#BF5AF2',
  notApplicable: '#636366',

  // Quality
  qualityHigh: '#30D158',
  qualityMedium: '#FF9F0A',
  qualityLow: '#FF453A',

  // Surfaces
  background: '#0C0C0E',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  border: '#38383A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5CC',
  textTertiary: '#EBEBF560',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  separator: '#38383A',
  overlay: 'rgba(0,0,0,0.7)',
};

export type ColorKey = keyof typeof Colors;
