import { useState, useEffect } from 'react'
import api from '../../services/api'
import { showMessage } from '../MessageBox'

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

const PartituraFormModal = ({ partitura, onClose, onSuccess }) => {
  const isEdit = Boolean(partitura)

  const [title, setTitle] = useState('')
  const [folder, setFolder] = useState('diversas')
  const [mp3, setMp3] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [time, setTime] = useState('3:00')
  const [pdfFile, setPdfFile] = useState(null)
  const [sibFile, setSibFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (partitura) {
      setTitle(partitura.title || partitura.name || '')
      setFolder(partitura.folder || 'diversas')
      setMp3(partitura.mp3 || '')
      setSlugTouched(true)
      setTime(partitura.time || '3:00')
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

  const handleTitleChange = (value) => {
    setTitle(value)
    if (!isEdit && !slugTouched) {
      setMp3(slugify(value))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!title.trim()) newErrors.title = 'Informe o nome da partitura.'
    if (!folder || !['racionais', 'diversas'].includes(folder)) {
      newErrors.folder = 'Selecione a pasta.'
    }
    if (!slugify(mp3)) newErrors.mp3 = 'Informe um slug válido (letras, números, _ ou -).'
    if (!isEdit && !pdfFile) newErrors.pdfFile = 'Selecione o arquivo PDF.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('folder', folder)
    formData.append('mp3', slugify(mp3))
    formData.append('time', time.trim() || '3:00')
    if (pdfFile) formData.append('pdfFile', pdfFile)
    if (sibFile) formData.append('sibFile', sibFile)

    setSubmitting(true)
    try {
      if (isEdit) {
        await api.put(`/api/admin/partituras/${partitura.id}`, formData)
        showMessage('Partitura atualizada com sucesso!')
      } else {
        await api.post('/api/admin/partituras', formData)
        showMessage('Partitura criada com sucesso!')
      }
      onSuccess()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao salvar partitura.', true)
    } finally {
      setSubmitting(false)
    }
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
            Os ficheiros vão para o Cloudflare R2 em{' '}
            <code className="text-xs">{`{folder}/pdf|sib/{'{slug}'}`}</code>, como a página pública já consome.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="partitura-title" className="block text-sm font-medium mb-1 opacity-70">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="partitura-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex.: Bolero de Ravel"
                className={`w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all ${
                  errors.title ? 'border-red-500' : 'border-rjb-yellow/20'
                }`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="partitura-folder" className="block text-sm font-medium mb-1 opacity-70">
                  Pasta <span className="text-red-500">*</span>
                </label>
                <select
                  id="partitura-folder"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className={`w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all ${
                    errors.folder ? 'border-red-500' : 'border-rjb-yellow/20'
                  }`}
                >
                  <option value="racionais">Racionais</option>
                  <option value="diversas">Outros clássicos</option>
                </select>
                {errors.folder && <p className="text-xs text-red-500 mt-1">{errors.folder}</p>}
              </div>
              <div>
                <label htmlFor="partitura-time" className="block text-sm font-medium mb-1 opacity-70">
                  Duração
                </label>
                <input
                  id="partitura-time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="3:00"
                  className="w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="partitura-mp3" className="block text-sm font-medium mb-1 opacity-70">
                Slug do ficheiro <span className="text-red-500">*</span>
              </label>
              <input
                id="partitura-mp3"
                type="text"
                value={mp3}
                onChange={(e) => {
                  setSlugTouched(true)
                  setMp3(e.target.value)
                }}
                placeholder="Bolero_De_Ravel"
                className={`w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all ${
                  errors.mp3 ? 'border-red-500' : 'border-rjb-yellow/20'
                }`}
              />
              <p className="text-xs text-rjb-text/50 dark:text-rjb-text-dark/50 mt-1">
                Usado nos paths <code>pdf/{'{slug}'}.pdf</code> e <code>sib/{'{slug}'}.sib</code>.
              </p>
              {errors.mp3 && <p className="text-xs text-red-500 mt-1">{errors.mp3}</p>}
            </div>

            <div>
              <label htmlFor="partitura-pdf" className="block text-sm font-medium mb-1 opacity-70">
                PDF {isEdit ? '(opcional — substituir)' : <span className="text-red-500">*</span>}
              </label>
              <input
                id="partitura-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className={`w-full p-3 text-sm rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rjb-yellow file:text-rjb-text ${
                  errors.pdfFile ? 'border-red-500' : 'border-rjb-yellow/20'
                }`}
              />
              {(pdfFile || partitura?.pdfFileName) && (
                <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-1 truncate">
                  {pdfFile ? pdfFile.name : `Atual: ${partitura.pdfFileName}`}
                </p>
              )}
              {errors.pdfFile && <p className="text-xs text-red-500 mt-1">{errors.pdfFile}</p>}
            </div>

            <div>
              <label htmlFor="partitura-sib" className="block text-sm font-medium mb-1 opacity-70">
                SIB (Sibelius) {isEdit ? '(opcional — substituir)' : '(opcional)'}
              </label>
              <input
                id="partitura-sib"
                type="file"
                accept=".sib,application/octet-stream"
                onChange={(e) => setSibFile(e.target.files?.[0] || null)}
                className="w-full p-3 text-sm rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rjb-yellow file:text-rjb-text"
              />
              {(sibFile || partitura?.sibFileName) && (
                <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-1 truncate">
                  {sibFile ? sibFile.name : `Atual: ${partitura.sibFileName}`}
                </p>
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
                {submitting ? 'A guardar...' : 'Finalizar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PartituraFormModal
