import { useRef, useCallback } from 'react'

const useThrottle = (callback, delay = 300) => {
  const lastRun = useRef(Date.now())

  return useCallback(
    (...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    },
    [callback, delay]
  )
}

export default useThrottle
