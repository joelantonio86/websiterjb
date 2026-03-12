import { useEffect } from 'react'

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignorar se estiver digitando em input, textarea ou contenteditable
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const modKey = event.metaKey ? 'meta' : (event.ctrlKey ? 'ctrl' : null)
      const shift = event.shiftKey
      const alt = event.altKey

      // Criar string de combinação (meta para Mac Cmd, ctrl para Ctrl)
      const combination = [
        modKey,
        shift && 'shift',
        alt && 'alt',
        key
      ].filter(Boolean).join('+')

      // Procurar atalho correspondente (aceita ctrl+k e meta+k para busca)
      const shortcut = shortcuts.find(s => {
        if (s.keys === combination || s.keys === key) return true
        if ((combination === 'ctrl+k' || combination === 'meta+k') && (s.keys === 'ctrl+k' || s.keys === 'meta+k')) return true
        return false
      })

      if (shortcut) {
        event.preventDefault()
        shortcut.handler(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export default useKeyboardShortcuts
