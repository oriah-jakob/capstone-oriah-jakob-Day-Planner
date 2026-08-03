import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/**
 * Scan the current page against the WCAG 2.1 A/AA rulesets and fail on any
 * violation. Backs test case A-01 and NFR-10/NFR-11.
 */
export async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(' ')),
  }))

  expect(summary, `axe found ${summary.length} violation(s)`).toEqual([])
}
