import { useCallback, useEffect, useRef, useState } from "react"
import { getErrorMessage } from "@/api/client"

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

// Lightweight data-fetching hook with loading/error states and a refetch fn.
// Used instead of SWR since this SPA talks to a separate REST backend and we
// want explicit control over refetch-after-mutation.
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  options: { immediate?: boolean } = { immediate: true },
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: Boolean(options.immediate),
    error: null,
  })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fn()
      if (mounted.current) setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      if (mounted.current)
        setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }))
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (options.immediate) {
      run().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, refetch: run, setData: (data: T) => setState((s) => ({ ...s, data })) }
}
