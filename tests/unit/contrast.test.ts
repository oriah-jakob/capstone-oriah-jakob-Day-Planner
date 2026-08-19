import { describe, expect, it } from 'vitest'

import { blendHex, contrastRatio, parseHex, relativeLuminance } from '@/lib/contrast'

describe('parseHex', () => {
  it('parses six-digit hex', () => {
    expect(parseHex('#1b6fc0')).toEqual({ r: 27, g: 111, b: 192 })
  })

  it('expands three-digit shorthand', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('tolerates a missing leading hash', () => {
    expect(parseHex('000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('rejects a non-colour', () => {
    expect(() => parseHex('rebeccapurple')).toThrow(/not a hex colour/i)
  })
})

describe('relativeLuminance', () => {
  it('returns 0 for black and 1 for white', () => {
    expect(relativeLuminance(parseHex('#000000'))).toBeCloseTo(0, 5)
    expect(relativeLuminance(parseHex('#ffffff'))).toBeCloseTo(1, 5)
  })
})

describe('blendHex', () => {
  it('mixes the colour with the backdrop by alpha', () => {
    expect(blendHex('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('returns the colour itself when opaque and the backdrop when transparent', () => {
    expect(blendHex('#1663ad', '#ffffff', 1)).toBe('#1663ad')
    expect(blendHex('#1663ad', '#ffffff', 0)).toBe('#ffffff')
  })
})

describe('contrastRatio', () => {
  it('gives the maximum 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2)
  })

  it('gives 1:1 for a colour against itself', () => {
    expect(contrastRatio('#1b6fc0', '#1b6fc0')).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#1b6fc0', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#1b6fc0'), 10)
  })
})
