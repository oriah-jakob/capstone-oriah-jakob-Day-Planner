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
function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

/** Composite a translucent colour over an opaque backdrop, as the browser does for `bg-primary/90`. */
export function blendHex(foreground: string, backdrop: string, alpha: number): string {
  const top = parseHex(foreground)
  const under = parseHex(backdrop)
  const mix = (a: number, b: number) => Math.round(a * alpha + b * (1 - alpha))
  return toHex({ r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b) })
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(parseHex(foreground))
  const l2 = relativeLuminance(parseHex(background))
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (lighter + 0.05) / (darker + 0.05)
}
