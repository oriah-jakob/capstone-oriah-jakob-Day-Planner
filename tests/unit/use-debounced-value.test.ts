import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedValue } from '@/hooks/use-debounced-value'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebouncedValue', () => {
  it('starts with the initial value', () => {
    const { result } = renderHook(() => useDebouncedValue('gym', 300))
    expect(result.current).toBe('gym')
  })

  it('waits for the delay before taking a new value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'g' },
    })

    rerender({ value: 'gym' })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('g')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('gym')
  })

  it('only takes the last value of a quick burst', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '' },
    })

    for (const value of ['c', 'ch', 'ch ', 'ch 5']) {
      rerender({ value })
      act(() => {
        vi.advanceTimersByTime(100)
      })
    }
    expect(result.current).toBe('')

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('ch 5')
  })
})
