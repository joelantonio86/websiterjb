import { useState, useEffect } from 'react'

let showMessageGlobal = null

export const showMessage = (msg, isError = false) => {
  if (showMessageGlobal) {
    showMessageGlobal(msg, isError)
  }
}

const MessageBox = () => {
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    showMessageGlobal = (msg, error = false) => {
      setMessage(msg)
      setIsError(error)
      setVisible(true)
      
      const displayTime = error ? 5000 : 2500
      setTimeout(() => {
        setVisible(false)
      }, displayTime)
    }
    
    return () => {
      showMessageGlobal = null
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`fixed top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 animate-fade-in max-w-md w-full mx-4 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl backdrop-blur-sm flex items-center gap-3 ${
        isError 
          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400/50' 
          : 'bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text border-2 border-yellow-400/50'
      }`}>
        {isError ? (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )}
        <p className="font-semibold text-sm sm:text-base flex-1">{message}</p>
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Fechar mensagem"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MessageBox
