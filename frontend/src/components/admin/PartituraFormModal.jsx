import { useState, useEffect } from 'react'

// Gera um id simples só para uso local (chaves de lista / identificação em memória).
// Não depende de nenhuma API - é usado apenas para controlar o estado no front.
const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const PartituraFormModal = ({ partitura, onClose, onSuccess }) => {
  const isEdit = Boolean(partitura)

  const [name, setName] = useState('')

  // Partitura completa (PDF com todas as bancadas de instrumentos)
  const [fullScoreFile, setFullScoreFile] = useState(null)
  const [existingFullScoreName, setExistingFullScoreName] = useState('')

  // Partituras avulsas por instrumento: cada item tem nome do instrumento + arquivo PDF
  const [instrumentParts, setInstrumentParts] = useState([])

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (partitura) {
      setName(partitura.name || '')
      setExistingFullScoreName(partitura.fullScoreFileName || '')
      setInstrumentParts(
        (partitura.parts || []).map((p) => ({
          id: p.id || generateId(),
          instrumentName: p.instrumentName || '',
          file: null,
          existingFileName: p.fileName || ''
        }))
      )
    }
  }, [partitura])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const addInstrumentPart = () => {
    setInstrumentParts((prev) => [
      ...prev,
      { id: generateId(), instrumentName: '', file: null, existingFileName: '' }
    ])
  }

  const updateInstrumentPart = (id, field, value) => {
    setInstrumentParts((prev) =>
      prev.map((part) => (part.id === id ? { ...part, [field]: value } : part))
    )
  }

  const removeInstrumentPart = (id) => {
    setInstrumentParts((prev) => prev.filter((part) => part.id !== id))
  }

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Informe o nome da partitura.'
    if (!fullScoreFile && !existingFullScoreName) {
      newErrors.fullScoreFile = 'Selecione o arquivo PDF da partitura completa.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    // Só entram no resultado final as partes de instrumento que tiverem nome E arquivo
    // (novo ou já existente, no caso de edição sem substituição).
    const validParts = instrumentParts
      .filter((p) => p.instrumentName.trim() && (p.file || p.existingFileName))
      .map((p) => ({
        id: p.id,
        instrumentName: p.instrumentName.trim(),
        file: p.file,
        fileName: p.file ? p.file.name : p.existingFileName
      }))

    setSubmitting(true)

    const payload = {
      id: partitura?.id || generateId(),
      name: name.trim(),
      fullScoreFile,
      fullScoreFileName: fullScoreFile ? fullScoreFile.name : existingFullScoreName,
      parts: validParts
    }

    // Sem integração com API por enquanto - o componente pai é quem guarda a lista em memória.
    onSuccess(payload)
    setSubmitting(false)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[95] flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-rjb-card-light dark:bg-rjb-card-dark rounded-2xl shadow-2xl border border-rjb-yellow/30 max-h-[90vh] overflow-y-auto relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-rjb-text/50 dark:text-rjb-text-dark/50 hover:text-rjb-yellow transition-colors text-2xl leading-none"
          aria-label="Fechar"
        >
          &times;
        </button>

        <div className="p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-rjb-yellow mb-1">
            {isEdit ? 'Editar partitura' : 'Nova partitura'}
          </h3>
          <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mb-6">
            {isEdit
              ? 'Atualize as informações e os arquivos da partitura.'
              : 'Preencha os dados para cadastrar uma nova partitura.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="partitura-name" className="block text-sm font-medium mb-1 opacity-70">
                Nome da partitura <span className="text-red-500">*</span>
              </label>
              <input
                id="partitura-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Garota de Ipanema"
                className={`w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all ${
                  errors.name ? 'border-red-500' : 'border-rjb-yellow/20'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="partitura-full-score" className="block text-sm font-medium mb-1 opacity-70">
                Partitura completa (todas as bancadas) <span className="text-red-500">*</span>
              </label>
              <input
                id="partitura-full-score"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFullScoreFile(e.target.files?.[0] || null)}
                className={`w-full p-3 text-sm rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rjb-yellow file:text-rjb-text ${
                  errors.fullScoreFile ? 'border-red-500' : 'border-rjb-yellow/20'
                }`}
              />
              {(fullScoreFile || existingFullScoreName) && (
                <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-1 truncate">
                  Arquivo selecionado: {fullScoreFile ? fullScoreFile.name : existingFullScoreName}
                </p>
              )}
              {errors.fullScoreFile && <p className="text-xs text-red-500 mt-1">{errors.fullScoreFile}</p>}
            </div>

            <div className="pt-2 border-t border-rjb-yellow/20">
              <div className="flex items-center justify-between mb-2 pt-3">
                <label className="block text-sm font-medium opacity-70">
                  Partituras por instrumento
                </label>
                <button
                  type="button"
                  onClick={addInstrumentPart}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rjb-yellow hover:underline"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar instrumento
                </button>
              </div>

              {instrumentParts.length === 0 ? (
                <p className="text-xs text-rjb-text/50 dark:text-rjb-text-dark/50">
                  Nenhuma partitura por instrumento adicionada ainda. Use o botão acima para incluir uma.
                </p>
              ) : (
                <div className="space-y-3">
                  {instrumentParts.map((part) => (
                    <div
                      key={part.id}
                      className="rounded-lg border border-rjb-yellow/20 p-3 bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/30 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={part.instrumentName}
                          onChange={(e) => updateInstrumentPart(part.id, 'instrumentName', e.target.value)}
                          placeholder="Nome do instrumento (ex.: Clarinete)"
                          className="flex-1 p-2.5 text-sm rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeInstrumentPart(part.id)}
                          className="shrink-0 w-8 h-8 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                          aria-label="Remover este instrumento"
                        >
                          &times;
                        </button>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => updateInstrumentPart(part.id, 'file', e.target.files?.[0] || null)}
                        className="w-full p-2.5 text-xs rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rjb-yellow file:text-rjb-text"
                      />
                      {(part.file || part.existingFileName) && (
                        <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 truncate">
                          Arquivo selecionado: {part.file ? part.file.name : part.existingFileName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg border border-rjb-yellow/50 font-bold hover:bg-rjb-yellow/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-lg bg-rjb-yellow text-rjb-text font-bold hover:bg-yellow-500 shadow-subtle-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Finalizar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PartituraFormModal