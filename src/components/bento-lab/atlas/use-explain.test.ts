import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useExplain } from './use-explain'

describe('useExplain', () => {
  it('starts without meanings and loads them once primed', async () => {
    const { result } = renderHook(() => useExplain())
    expect(result.current.explainer).toBeNull()
    act(() => result.current.prime())
    await waitFor(() => expect(result.current.explainer).not.toBeNull())
    expect(typeof result.current.explainer!.explain).toBe('function')
  })
})
