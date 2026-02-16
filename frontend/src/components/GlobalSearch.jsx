import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const searchItems = [
    { path: '/', label: 'Home', icon: '🏠', category: 'Páginas' },
    { path: '/sobre', label: 'Sobre', icon: '📖', category: 'Páginas' },
    { path: '/apresentacoes', label: 'Apresentações', icon: '🎬', category: 'A RJB' },
    { path: '/bastidores', label: 'Ensaios', icon: '🎤', category: 'A RJB' },
    { path: '/player', label: 'Músicas', icon: '🎵', category: 'A RJB' },
    { path: '/partituras', label: 'Partituras', icon: '🎼', category: 'A RJB' },
    { path: '/repertorio-apresentacoes', label: 'Repertório 2026', icon: '📋', category: 'A RJB' },
    { path: '/fotos', label: 'Galeria de Fotos', icon: '📸', category: 'A RJB' },
    { path: '/agenda', label: 'Agenda', icon: '📅', category: 'Páginas' },
    { path: '/contato', label: 'Contato', icon: '✉️', category: 'Páginas' },
    { path: '/cadastro', label: 'Cadastro de Membros', icon: '👤', category: 'Páginas' },
    { path: '/relatorios', label: 'Área Administrativa', icon: '🔐', category: 'Admin' }
  ]

  useKeyboardShortcuts([
    {
      keys: 'ctrl+k',
      handler: () => {
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    },
    {
      keys: 'escape',
      handler: () => {
        if (isOpen) {
          setIsOpen(false)
          setQuery('')
        }
      }
    }
  ])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const filtered = searchItems.filter(item => {
      const normalizedLabel = item.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return normalizedLabel.includes(normalizedQuery)
    })

    setResults(filtered)
    setSelectedIndex(-1)
  }, [query])

  const handleSelect = (item) => {
    navigate(item.path)
    setIsOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 sm:pt-32 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-2xl mx-4 bg-gradient-to-br from-rjb-card-light to-rjb-card-light/95 dark:from-rjb-card-dark dark:to-rjb-card-dark/95 rounded-2xl shadow-2xl border-2 border-rjb-yellow/30 overflow-hidden transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-rjb-yellow/20">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar páginas... (Ctrl+K)"
              className="w-full pl-12 pr-4 py-3 text-base bg-rjb-bg-light dark:bg-rjb-bg-dark border-2 border-rjb-yellow/30 rounded-xl focus:border-rjb-yellow focus:ring-2 focus:ring-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none transition-all"
              autoFocus
            />
          </div>
        </div>

        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(
              results.reduce((acc, item) => {
                if (!acc[item.category]) acc[item.category] = []
                acc[item.category].push(item)
                return acc
              }, {})
            ).map(([category, items]) => (
              <div key={category} className="p-2">
                <div className="px-3 py-1 text-xs font-semibold text-rjb-text/60 dark:text-rjb-text-dark/60 uppercase tracking-wide">
                  {category}
                </div>
                {items.map((item, idx) => {
                  const globalIndex = results.indexOf(item)
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedIndex === globalIndex
                          ? 'bg-rjb-yellow/20 text-rjb-yellow'
                          : 'hover:bg-rjb-yellow/10 text-rjb-text dark:text-rjb-text-dark'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-rjb-text/60 dark:text-rjb-text-dark/60">Nenhum resultado encontrado</p>
          </div>
        )}

        {!query && (
          <div className="p-8 text-center">
            <p className="text-rjb-text/60 dark:text-rjb-text-dark/60 mb-4">Digite para buscar...</p>
            <div className="flex flex-wrap gap-2 justify-center text-xs text-rjb-text/40 dark:text-rjb-text-dark/40">
              <kbd className="px-2 py-1 bg-rjb-bg-light dark:bg-rjb-bg-dark rounded border border-rjb-text/20">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-rjb-bg-light dark:bg-rjb-bg-dark rounded border border-rjb-text/20">K</kbd>
              <span>para abrir busca</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GlobalSearch
