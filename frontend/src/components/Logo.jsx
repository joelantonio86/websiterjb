import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const Logo = () => {
  const { isDark } = useTheme()
  const [imageError, setImageError] = useState(false)
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)

  // Tenta primeiro do site em produção, depois local
  const logoUrls = {
    light: [
      'https://www.racionaljazzband.com.br/logo.jpeg',
      '/logo.jpeg',
      '/logo.jpg'
    ],
    dark: [
      'https://www.racionaljazzband.com.br/logo-dark.png',
      '/logo-dark.png'
    ]
  }

  const currentUrls = isDark ? logoUrls.dark : logoUrls.light

  // Reset quando o tema mudar
  useEffect(() => {
    setImageError(false)
    setCurrentUrlIndex(0)
  }, [isDark])

  const handleImageError = () => {
    if (currentUrlIndex < currentUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1)
    } else {
      setImageError(true)
    }
  }

  return (
    <Link to="/" className="hover:opacity-80 transition-opacity flex items-center space-x-2">
      {!imageError && currentUrlIndex < currentUrls.length ? (
        <img 
          src={currentUrls[currentUrlIndex]} 
          alt="Racional Jazz Band Logo"
          className="h-16 w-auto rjb-logo-image"
          onError={handleImageError}
          key={currentUrlIndex}
        />
      ) : (
        <div className="h-16 w-16 rounded-full border-2 border-rjb-yellow flex items-center justify-center bg-rjb-yellow/10 dark:bg-rjb-yellow/5 shadow-lg">
          <span className="text-2xl font-bold rjb-logo-text">RJB</span>
        </div>
      )}
      <span className="sr-only">Racional Jazz Band</span>
    </Link>
  )
}

export default Logo
