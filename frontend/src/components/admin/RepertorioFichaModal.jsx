import { useEffect, useState } from 'react'
import api from '../../services/api'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import { blankFicha, moveSong } from '../../utils/repertorioFicha'
import { downloadRepertorioFichaPdf } from '../../utils/repertorioFichaPdf'

const formatDate = (dateStr) => {
  const match = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return 'Data não informada'
  return `${match[3]}/${match[2]}/${match[1]}`
}

const FIELDS = [
  { key: 'regencia', label: 'Regência', placeholder: 'Regência' },
  { key: 'interprete', label: 'Intérprete', placeholder: 'Intérprete ou Instrumental' },
  { key: 'partEsp', label: 'Part. esp.', placeholder: 'Part. esp.' },
  { key: 'observacao', label: 'Observações', placeholder: 'Observação' },
]

const RepertorioFichaModal = ({ repertorio, onClose, onSaved }) => {
  const [songs, setSongs] = useState(() => (repertorio?.songs || []).map(blankFicha))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleEscape = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const updateSong = (index, key, value) => {
    setSongs((current) => current.map((song, songIndex) => (
      songIndex === index ? { ...song, [key]: value } : song
    )))
  }

  const save = async () => {
    setSaving(true)
    showLoader(true, 'Salvando ficha...')
    try {
      const payload = {
        name: repertorio.name,
        date: repertorio.date,
        location: repertorio.location || '',
        songs: songs.map(blankFicha),
      }
      await api.put(`/api/admin/repertorios/${repertorio.id}`, payload)
      showMessage('Ficha salva.')
      onSaved()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Não foi possível salvar a ficha.', true)
    } finally {
      setSaving(false)
      showLoader(false)
    }
  }

  const download = () => {
    downloadRepertorioFichaPdf({
      name: repertorio.name,
      date: repertorio.date,
      location: repertorio.location,
      songs: songs.map(blankFicha),
    })
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[95] flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col bg-rjb-card-light dark:bg-rjb-card-dark rounded-2xl shadow-2xl border border-rjb-yellow/30"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-repertorio-title"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-rjb-yellow/20">
          <div className="min-w-0">
            <h3 id="ficha-repertorio-title" className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark break-words">
              Ficha do repertório
            </h3>
            <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1 break-words">
              {repertorio.name} · {formatDate(repertorio.date)}
              {repertorio.location ? ` · ${repertorio.location}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={download}
              disabled={songs.length === 0}
              className="px-3 py-2 rounded-lg border border-rjb-yellow/50 text-sm font-semibold text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 disabled:opacity-50"
            >
              Baixar PDF
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || songs.length === 0}
              className="px-3 py-2 rounded-lg bg-rjb-yellow text-rjb-text text-sm font-bold hover:bg-yellow-500 disabled:opacity-60"
            >
              Salvar ficha
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-stone-400/40 text-sm font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="overflow-auto p-4 sm:p-6">
          {songs.length === 0 ? (
            <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
              Este repertório ainda não tem músicas. Use Editar para escolher as músicas e depois preencha a ficha.
            </p>
          ) : (
            <>
              <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mb-3">
                O número segue a ordem da lista. Use as setas para mudar a sequência.
              </p>
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-stone-300 dark:border-stone-600">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-black text-white text-xs uppercase">
                      <th className="px-2 py-2 w-14 text-center">Nº</th>
                      <th className="px-2 py-2 text-left">Nome da música</th>
                      <th className="px-2 py-2 text-left">Reg.</th>
                      <th className="px-2 py-2 text-left">Intérprete</th>
                      <th className="px-2 py-2 text-left">Part. esp.</th>
                      <th className="px-2 py-2 text-left">Observações</th>
                      <th className="px-2 py-2 w-16 text-center">Ordem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {songs.map((song, index) => (
                      <tr key={`${song.folder}-${song.mp3}-${index}`} className="border-t border-stone-300 dark:border-stone-600">
                        <td className="px-2 py-2 text-center font-semibold">{index + 1}</td>
                        <td className="px-2 py-2 font-medium text-rjb-text dark:text-rjb-text-dark">{song.title}</td>
                        {FIELDS.map((field) => (
                          <td key={field.key} className="px-2 py-2">
                            <input
                              value={song[field.key]}
                              onChange={(event) => updateSong(index, field.key, event.target.value)}
                              aria-label={`${field.label} de ${song.title}`}
                              placeholder={field.placeholder}
                              className={`w-full min-w-[8rem] px-2 py-1.5 rounded-md border text-sm bg-white dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow ${
                                field.key === 'partEsp' && song.partEsp.trim()
                                  ? 'border-sky-300 bg-sky-50 dark:bg-sky-950/40'
                                  : 'border-stone-300 dark:border-stone-600'
                              }`}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Subir ${song.title}`}
                              disabled={index === 0}
                              onClick={() => setSongs((current) => moveSong(current, index, -1))}
                              className="px-2 py-0.5 rounded border border-stone-300 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              aria-label={`Descer ${song.title}`}
                              disabled={index === songs.length - 1}
                              onClick={() => setSongs((current) => moveSong(current, index, 1))}
                              className="px-2 py-0.5 rounded border border-stone-300 disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {songs.map((song, index) => (
                  <article key={`${song.folder}-${song.mp3}-card-${index}`} className="rounded-xl border border-stone-300 dark:border-stone-600 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-rjb-text dark:text-rjb-text-dark">
                        {index + 1}. {song.title}
                      </p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Subir ${song.title}`}
                          disabled={index === 0}
                          onClick={() => setSongs((current) => moveSong(current, index, -1))}
                          className="px-2 py-1 rounded border border-stone-300 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Descer ${song.title}`}
                          disabled={index === songs.length - 1}
                          onClick={() => setSongs((current) => moveSong(current, index, 1))}
                          className="px-2 py-1 rounded border border-stone-300 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    {FIELDS.map((field) => (
                      <label key={field.key} className="block text-xs">
                        <span className="font-semibold text-rjb-text/70 dark:text-rjb-text-dark/70">{field.label}</span>
                        <input
                          value={song[field.key]}
                          onChange={(event) => updateSong(index, field.key, event.target.value)}
                          placeholder={field.placeholder}
                          className="mt-1 w-full px-2 py-2 rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-rjb-bg-dark text-sm text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow"
                        />
                      </label>
                    ))}
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RepertorioFichaModal
