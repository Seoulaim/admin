import { useCallback, useEffect, useState } from 'react'

const TOAST_MS = 2500

// const { toast, showToast } = useToast(); render <Toast toast={toast} />.
// initialMessage: shown on mount (e.g. "저장했어요" after coming back).
export function useToast(initialMessage) {
  const [toast, setToast] = useState(
    initialMessage ? { id: 0, message: initialMessage } : null,
  )

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = useCallback(
    (message) => setToast({ id: Date.now(), message }),
    [],
  )

  return { toast, showToast }
}
