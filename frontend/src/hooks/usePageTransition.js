import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const usePageTransition = () => {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLocation, setDisplayLocation] = useState(location)

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setIsTransitioning(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [location, displayLocation])

  return { isTransitioning, displayLocation }
}

export default usePageTransition
