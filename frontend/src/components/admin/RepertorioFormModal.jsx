import { useState, useMemo, useEffect } from 'react'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import api from '../../services/api'
import usePartiturasCatalog from '../../hooks/usePartiturasCatalog'

const getSongId = (song) => `${song.folder}-${song.mp3}`

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const RepertorioFormModal = ({ repertorio, onClose, onSuccess }) => {
  const isEdit = Boolean(repertorio)
  const { racionais, diversas } = usePartiturasCatalog()

  const ALL_SONGS = useMemo(
    () =>
      [
        ...racionais.map((s) => ({ ...s, folder: 'racionais', category: 'Músicas Racionais' })),
        ...diversas.map((s) => ({ ...s, folder: 'diversas', category: 'Outros Clássicos' })),
      ].sort((a, b) => a.title.localeCompare(b.title)),
    [racionais, diversas]
  )

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [songSearch, setSongSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (repertorio) {
      setName(repertorio.name || '')
      setDate(repertorio.date || '')
      setLocation(repertorio.location || '')
      setSelectedIds(new Set((repertorio.songs || []).map((s) => `${s.folder}-${s.mp3}`)))
    }
  }, [repertorio])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const filteredSongs = useMemo(() => {
    const term = normalize(songSearch)
    if (!term) return ALL_SONGS
    return ALL_SONGS.filter((s) => normalize(s.title).includes(term))
  }, [songSearch, ALL_SONGS])

  const selectedSongs = useMemo(
    () => ALL_SONGS.filter((s) => selectedIds.has(getSongId(s))),
    [selectedIds, ALL_SONGS]
  )

  const toggleSong = (song) => {
    const id = getSongId(song)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Informe o nome do repertório.'
    if (!date) newErrors.date = 'Informe a data da apresentação.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name.trim(),
      date,
      location: location.trim(),
      songs: selectedSongs.map((s) => ({ title: s.title, folder: s.folder, mp3: s.mp3 })),
    }

    setSubmitting(true)
    showLoader(true, isEdit ? 'Salvando alterações...' : 'Criando repertório...')

    try {
      if (isEdit) {
        await api.put(`/api/admin/repertorios/${repertorio.id}`, payload)
        showMessage('Repertório atualizado com sucesso!')
      } else {
        await api.post('/api/admin/repertorios', payload)
        showMessage('Repertório criado com sucesso!')
      }
      onSuccess()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao salvar o repertório.', true)
    } finally {
      setSubmitting(false)
      showLoader(false)
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
            {isEdit ? 'Editar repertório' : 'Novo repertório'}
          </h3>
          <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mb-6">
            {isEdit
              ? 'Atualize as informações do repertório da apresentação.'
              : 'Preencha os dados para criar um novo repertório de apresentação.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="repertorio-name" className="block text-sm font-medium mb-1 opacity-70">
                Nome do repertório <span className="text-red-500">*</span>
              </label>
              <input
                id="repertorio-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Apresentação de Maio 2026"
                className={`w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all ${
                  errors.name ? 'border-red-500' : 'border-rjb-yellow/20'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="repertorio-date" className="block text-sm font-medium mb-1 opacity-70">
                  Data da apresentação <span className="text-red-500">*</span>
                </label>
                <input
                  id="repertorio-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all ${
                    errors.date ? 'border-red-500' : 'border-rjb-yellow/20'
                  }`}
                />
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
              </div>

              <div>
                <label htmlFor="repertorio-location" className="block text-sm font-medium mb-1 opacity-70">
                  Local
                </label>
                <input
                  id="repertorio-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Opcional"
                  className="w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">
                Músicas do repertório
              </label>

              {selectedSongs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedSongs.map((s) => (
                    <span
                      key={getSongId(s)}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-semibold bg-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark border border-rjb-yellow/40"
                    >
                      {s.title}
                      <button
                        type="button"
                        onClick={() => toggleSong(s)}
                        className="text-rjb-text/60 hover:text-red-500 transition-colors leading-none"
                        aria-label={`Remover ${s.title}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder="Buscar música pelo nome..."
                className="w-full p-3 text-base rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all mb-2"
              />

              <div className="max-h-48 overflow-y-auto rounded-lg border border-rjb-yellow/20 divide-y divide-rjb-yellow/10">
                {filteredSongs.length === 0 ? (
                  <p className="p-3 text-sm text-rjb-text/60 dark:text-rjb-text-dark/60">
                    Nenhuma música encontrada para "{songSearch}".
                  </p>
                ) : (
                  filteredSongs.map((song) => {
                    const id = getSongId(song)
                    const checked = selectedIds.has(id)
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${
                          checked ? 'bg-rjb-yellow/10' : 'hover:bg-rjb-yellow/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSong(song)}
                          className="w-4 h-4 rounded border-rjb-yellow text-rjb-yellow focus:ring-rjb-yellow"
                        />
                        <span className="flex-1 text-sm text-rjb-text dark:text-rjb-text-dark truncate">
                          {song.title}
                        </span>
                        <span className="text-xs text-rjb-text/50 dark:text-rjb-text-dark/50 flex-shrink-0">
                          {song.category}
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
              <p className="text-xs text-rjb-text/50 dark:text-rjb-text-dark/50 mt-1">
                {selectedSongs.length} música{selectedSongs.length !== 1 ? 's' : ''} selecionada{selectedSongs.length !== 1 ? 's' : ''}.
              </p>
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

export default RepertorioFormModal
