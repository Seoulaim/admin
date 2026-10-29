import { useCallback, useEffect, useState } from 'react'

// Same as the member app's useFetch.
// `fetcher` must be a stable function (e.g. an api module export).
// data is undefined while loading; error is the rejection (usually an
// ApiError); reload() fetches again and shows the loading state meanwhile.
// update(fn) changes the loaded data in place (e.g. after a switch flips).
export function useFetch(fetcher) {
  const [result, setResult] = useState({ data: undefined, error: undefined })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false
    fetcher().then(
      (data) => !ignore && setResult({ data, error: undefined }),
      (error) => !ignore && setResult({ data: undefined, error }),
    )
    return () => {
      ignore = true
    }
  }, [fetcher, attempt])

  const reload = useCallback(() => {
    setResult({ data: undefined, error: undefined })
    setAttempt((n) => n + 1)
  }, [])

  const update = useCallback(
    (fn) => setResult((prev) => ({ ...prev, data: fn(prev.data) })),
    [],
  )

  return { ...result, reload, update }
}
