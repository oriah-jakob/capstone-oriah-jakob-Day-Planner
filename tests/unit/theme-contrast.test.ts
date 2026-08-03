// @vitest-environment node
// Runs in node rather than jsdom so the stylesheet can be read off disk;
// vitest stubs CSS imports to an empty string under the browser environment.

import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { describe, expect, it } from 'vitest'

import { AA_NORMAL_TEXT, contrastRatio } from '@/lib/contrast'

const css = readFileSync(fileURLToPath(new URL('../../src/index.css', import.meta.url)), 'utf8')

/**
 * NFR-10 (WCAG 1.4.3): every text/background token pair the UI actually uses
 * must clear 4.5:1. This reads the real stylesheet rather than a copy of the
 * palette, so changing a colour in src/index.css fails here instead of failing
 * the axe audit in week 11.
 */

function readTokens(selector: string): Record<string, string> {
  const block = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css)
  if (!block?.[1]) {
    throw new Error(`No ${selector} block found in src/index.css`)
  }

  const tokens: Record<string, string> = {}
  for (const [, name, value] of block[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,8});/gi)) {
    if (name && value) tokens[name] = value
  }
  return tokens
}

/** Foreground/background token pairs that render text together. */
const TEXT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['success-foreground', 'success'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
]

describe.each([
  ['light theme', ':root'],
  ['dark theme', '\\.dark'],
])('%s', (_label, selector) => {
  const tokens = readTokens(selector)

  it.each(TEXT_PAIRS)('%s on %s meets WCAG AA', (fg, bg) => {
    const foreground = tokens[fg]
    const background = tokens[bg] ?? readTokens(':root')[bg]

    expect(foreground, `--${fg} is not defined in ${selector}`).toBeDefined()
    expect(background, `--${bg} is not defined`).toBeDefined()

    const ratio = contrastRatio(foreground!, background!)
    expect(
      ratio,
      `--${fg} (${foreground}) on --${bg} (${background}) is ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })
})
