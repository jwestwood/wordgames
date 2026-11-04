/** JS mirror of the colour tokens in tokens.css (keep in sync) for contrast tests and canvas use. */
export const colors = {
  paper: '#F4EBD9',
  paperLight: '#FAF5EA',
  paperDark: '#E9DCC2',
  tile: '#E8D3A9',
  wood: '#C89B5E',
  woodDark: '#8A6236',
  ink: '#2B2B2B',
  inkMuted: '#5A5145',
  red: '#B23A2E',
  redDark: '#8E2C22',
  green: '#2F5D50',
  greenDark: '#22463C',
  absent: '#6B6255',
} as const;

/** Foreground/background pairs used by components; each must meet WCAG AA (4.5:1). */
export const contrastPairs: Array<[name: string, fg: string, bg: string]> = [
  ['body text', colors.ink, colors.paper],
  ['muted text', colors.inkMuted, colors.paper],
  ['text on surface', colors.ink, colors.paperLight],
  ['accent link', colors.red, colors.paper],
  ['success text', colors.green, colors.paper],
  ['tile default', colors.ink, colors.tile],
  ['tile selected', colors.ink, colors.wood],
  ['tile correct', colors.paperLight, colors.green],
  ['tile present', colors.paperLight, colors.red],
  ['tile absent', colors.paperLight, colors.absent],
  ['primary button', colors.paperLight, colors.green],
  ['danger button', colors.paperLight, colors.red],
];
