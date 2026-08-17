/**
 * WCAG 2.1 relative luminance and contrast ratio.
 * Used to hold the design tokens to NFR-10 (WCAG 1.4.3, Contrast Minimum).
 * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */

/** Minimum contrast ratio for normal-sized body text at WCAG AA. */
export const AA_NORMAL_TEXT = 4.5

/** Minimum contrast ratio for large text (>=18.66px bold or >=24px) at WCAG AA. */
export const AA_LARGE_TEXT = 3

export type Rgb = { r: number; g: number; b: number }

/** Parse `#rgb` or `#rrggbb` into 0-255 channels. */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, '')

  const expanded =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    throw new Error(`Not a hex colour: ${hex}`)
  }

  const int = Number.parseInt(expanded, 16)
  return { r: (int >> 16) & 0xff, g: (int >> 8) & 0xff, b: int & 0xff }
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const s = channel / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/** Contrast ratio between two hex colours, from 1:1 to 21:1. */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(parseHex(foreground))
  const l2 = relativeLuminance(parseHex(background))
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (lighter + 0.05) / (darker + 0.05)
}
