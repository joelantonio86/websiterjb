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
      const ctrlOrCmd = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      const alt = event.altKey

      // Criar string de combinação de teclas
      const combination = [
        ctrlOrCmd && 'ctrl',
        shift && 'shift',
        alt && 'alt',
        key
      ].filter(Boolean).join('+')

      // Procurar atalho correspondente
      const shortcut = shortcuts.find(s => s.keys === combination || s.keys === key)

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
