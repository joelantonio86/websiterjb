import { useState } from 'react'
import { Link } from 'react-router-dom'

const Logo = () => {
  const [imageError, setImageError] = useState(false)

  return (
    <Link to="/" className="hover:opacity-80 transition-opacity flex items-center" aria-label="Orquestra Universo em Desencanto">
      {!imageError ? (
        <img
          src="/logo-oud.jpg"
          alt="Orquestra Universo em Desencanto"
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover"
          decoding="async"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-rjb-yellow bg-oud-green flex items-center justify-center">
          <span className="text-sm font-bold tracking-wide text-rjb-yellow">OUD</span>
        </div>
      )}
    </Link>
  )
}

export default Logo
