import { useState, useEffect } from 'react'

let setLoadingGlobal = null
let setMessageGlobal = null

export const showLoader = (show, message = 'Carregando...') => {
  if (setLoadingGlobal) {
    setLoadingGlobal(show)
    if (setMessageGlobal) {
      setMessageGlobal(message)
    }
  }
}

const LoadingOverlay = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Carregando...')

  useEffect(() => {
    setLoadingGlobal = setLoading
    setMessageGlobal = setMessage
    return () => {
      setLoadingGlobal = null
      setMessageGlobal = null
    }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-rjb-card-light dark:bg-rjb-card-dark rounded-xl p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rjb-yellow"></div>
          <p className="text-rjb-text dark:text-rjb-text-dark">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay
