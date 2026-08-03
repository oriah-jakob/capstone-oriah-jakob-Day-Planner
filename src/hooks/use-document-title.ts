import { useEffect } from 'react'

const SUFFIX = 'Remmi'

/**
 * Keep the tab title in sync with the current page. In a single page app the
 * title never changes on its own, which leaves screen reader users without a
 * cue that navigation happened (WCAG 2.4.2).
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title === SUFFIX ? SUFFIX : `${title} · ${SUFFIX}`
  }, [title])
}
