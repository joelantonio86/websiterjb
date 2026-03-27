import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import api from '../../services/api'
import { getMediaGalleryPeriods, formatPeriodLabel } from '../../data/mediaGalleryPeriods'
import { getStaticSiteMediaForMonth } from '../../data/staticSiteMediaReference'

const LEGACY_PERIOD = '_legacy'

function parsePeriodFromFileName (name = '') {
  const m = String(name).match(/^foto__(\d{4}-\d{2})__/i)
  return m ? m[1] : null
}

function classifyAttachment (name = '', mime = '') {
  const lower = String(name).toLowerCase()
  if (lower.startsWith('foto__') || String(mime).startsWith('image/')) return 'foto'
  return 'outro'
}

const AttachmentsManagement = () => {
  const periods = useMemo(() => getMediaGalleryPeriods(), [])
  const [attachments, setAttachments] = useState([])
  const [file, setFile] = useState(null)
  const [periodKey, setPeriodKey] = useState(() => periods[0]?.id || '2025-12')
  const [editing, setEditing] = useState(null)
  const [editPeriodKey, setEditPeriodKey] = useState('2025-12')
  const [replaceFile, setReplaceFile] = useState(null)

  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [youtubeForm, setYoutubeForm] = useState({
    title: '',
    url: '',
    periodKey: periods[0]?.id || '2025-12',
    category: 'bastidor',
    visibility: 'unlisted'
  })
  const [referencePeriodKey, setReferencePeriodKey] = useState('2025-12')

  const fetchAttachments = useCallback(async () => {
    try {
      const response = await api.get('/api/attachments/list')
      setAttachments(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar anexos:', error)
    }
  }, [])

  const fetchYoutubeVideos = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/youtube-videos')
      setYoutubeVideos(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar vídeos YouTube:', error)
    }
  }, [])

  useEffect(() => {
    fetchAttachments()
    fetchYoutubeVideos()
  }, [fetchAttachments, fetchYoutubeVideos])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return showMessage('Selecione uma foto para upload.', true)
    if (!periodKey) return showMessage('Selecione o período.', true)

    showLoader(true, 'Enviando foto...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('periodKey', periodKey)

    try {
      await api.post('/api/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showMessage('Foto enviada com sucesso!')
      setFile(null)
      e.target.reset()
      fetchAttachments()
    } catch (error) {
      const msg = error.response?.data?.message
      showMessage(msg || 'Erro ao enviar foto.', true)
    } finally {
      showLoader(false)
    }
  }

  const handleDelete = async (fileName) => {
    if (!confirm(`Deseja realmente excluir o arquivo "${fileName}"?`)) return
    try {
      await api.delete(`/api/attachments/delete/${encodeURIComponent(fileName)}`)
      showMessage('Arquivo excluído com sucesso!')
      setEditing((prev) => (prev?.name === fileName ? null : prev))
      fetchAttachments()
    } catch {
      showMessage('Erro ao excluir arquivo.', true)
    }
  }

  const openEdit = useCallback((attachment) => {
    const current = parsePeriodFromFileName(attachment.name) || '2025-12'
    setEditPeriodKey(current)
    setReplaceFile(null)
    setEditing(attachment)
  }, [])

  const closeEdit = useCallback(() => {
    setEditing(null)
    setReplaceFile(null)
  }, [])

  useEffect(() => {
    if (!editing) return
    const onKey = (ev) => ev.key === 'Escape' && closeEdit()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, closeEdit])

  const handleMovePeriod = async () => {
    if (!editing) return
    const current = parsePeriodFromFileName(editing.name)
    if (current !== null && current === editPeriodKey) {
      return showMessage('Escolha um período diferente do atual.', true)
    }
    showLoader(true, 'Atualizando período...')
    try {
      await api.patch('/api/attachments/move', {
        fileName: editing.name,
        periodKey: editPeriodKey
      })
      showMessage('Período atualizado!')
      closeEdit()
      fetchAttachments()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao mudar período.', true)
    } finally {
      showLoader(false)
    }
  }

  const handleReplaceFile = async (e) => {
    e.preventDefault()
    if (!editing || !replaceFile) return showMessage('Selecione uma foto para substituir.', true)
    const hadPeriod = !!parsePeriodFromFileName(editing.name)
    if (!hadPeriod && !editPeriodKey) return showMessage('Escolha o período (mês) para este arquivo antigo.', true)

    showLoader(true, 'Substituindo foto...')
    const formData = new FormData()
    formData.append('file', replaceFile)
    formData.append('existingFileName', editing.name)
    if (!hadPeriod) formData.append('periodKey', editPeriodKey)
    try {
      await api.post('/api/attachments/replace', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showMessage('Foto substituída com sucesso!')
      closeEdit()
      fetchAttachments()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao substituir foto.', true)
    } finally {
      showLoader(false)
    }
  }

  const handleAddYoutube = async (e) => {
    e.preventDefault()
    if (!youtubeForm.title.trim() || !youtubeForm.url.trim()) {
      return showMessage('Informe o título e o link do YouTube.', true)
    }
    showLoader(true, 'Salvando vídeo...')
    try {
      await api.post('/api/admin/youtube-videos', youtubeForm)
      showMessage('Vídeo cadastrado com sucesso!')
      setYoutubeForm((prev) => ({ ...prev, title: '', url: '' }))
      fetchYoutubeVideos()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao cadastrar vídeo.', true)
    } finally {
      showLoader(false)
    }
  }

  const handleDeleteYoutube = async (id) => {
    if (!confirm('Deseja remover este vídeo da lista administrativa?')) return
    try {
      await api.delete(`/api/admin/youtube-videos/${encodeURIComponent(id)}`)
      showMessage('Vídeo removido.')
      fetchYoutubeVideos()
    } catch {
      showMessage('Erro ao remover vídeo.', true)
    }
  }

  const photoAttachments = attachments.filter((a) => classifyAttachment(a.name, a.contentType) === 'foto')

  const groupedByPeriod = useMemo(() => {
    const map = new Map()
    photoAttachments.forEach((att) => {
      const p = parsePeriodFromFileName(att.name) || LEGACY_PERIOD
      if (!map.has(p)) map.set(p, [])
      map.get(p).push(att)
    })
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === LEGACY_PERIOD) return 1
      if (b[0] === LEGACY_PERIOD) return -1
      return a[0].localeCompare(b[0])
    })
  }, [photoAttachments])

  const groupedYoutube = useMemo(() => {
    const map = new Map()
    youtubeVideos.forEach((item) => {
      const p = item.periodKey || LEGACY_PERIOD
      if (!map.has(p)) map.set(p, [])
      map.get(p).push(item)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [youtubeVideos])

  const staticByReferencePeriod = useMemo(() => getStaticSiteMediaForMonth(referencePeriodKey), [referencePeriodKey])
  const uploadedByReferencePeriod = useMemo(
    () => photoAttachments.filter((a) => parsePeriodFromFileName(a.name) === referencePeriodKey),
    [photoAttachments, referencePeriodKey]
  )
  const hasAnyStaticByReferencePeriod =
    staticByReferencePeriod.photos.length > 0 ||
    staticByReferencePeriod.bastidorVideos.length > 0 ||
    staticByReferencePeriod.apresentacaoVideos.length > 0

  const displayName = (name) => String(name).replace(/^foto__/i, '').replace(/^\d{4}-\d{2}__/, '')

  return (
    <div className="bg-gradient-to-br from-rjb-card-light to-rjb-bg-light dark:from-rjb-card-dark dark:to-rjb-bg-dark/50 rounded-2xl shadow-xl border-2 border-rjb-yellow/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className="bg-gradient-to-r from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:via-rjb-yellow/5 dark:to-rjb-yellow/5 px-5 sm:px-6 py-4 border-b border-rjb-yellow/30">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-rjb-text dark:text-rjb-text-dark">Fotos do Site e Vídeos (YouTube)</h3>
        <p className="text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mt-0.5">Fotos por upload e vídeos por link do YouTube (não listado ok)</p>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        <form onSubmit={handleUpload} className="p-4 sm:p-5 border-2 border-dashed border-rjb-yellow/50 rounded-xl bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/30">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} className="w-full sm:min-w-[200px] sm:w-auto p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark">
              {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <input type="file" required accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="w-full sm:flex-1 p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rjb-yellow file:text-rjb-text" />
            <button type="submit" className="bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-3 px-6 rounded-xl text-sm">Enviar foto</button>
          </div>
        </form>

        <form onSubmit={handleAddYoutube} className="rounded-xl border border-rjb-yellow/25 bg-rjb-yellow/5 px-4 py-4 space-y-3">
          <p className="text-sm font-semibold text-rjb-text dark:text-rjb-text-dark">Vídeos do YouTube (link)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={youtubeForm.periodKey} onChange={(e) => setYoutubeForm((p) => ({ ...p, periodKey: e.target.value }))} className="w-full p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark">
              {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <select value={youtubeForm.category} onChange={(e) => setYoutubeForm((p) => ({ ...p, category: e.target.value }))} className="w-full p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark">
              <option value="bastidor">Bastidor</option>
              <option value="apresentacao">Apresentação</option>
            </select>
            <input value={youtubeForm.title} onChange={(e) => setYoutubeForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título do vídeo" className="w-full p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark" />
            <input value={youtubeForm.url} onChange={(e) => setYoutubeForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://youtu.be/... ou ID" className="w-full p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <select value={youtubeForm.visibility} onChange={(e) => setYoutubeForm((p) => ({ ...p, visibility: e.target.value }))} className="p-2 text-xs border border-rjb-yellow/30 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark">
              <option value="unlisted">Não listado</option>
              <option value="public">Público</option>
            </select>
            <button type="submit" className="bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-2.5 px-5 rounded-xl text-sm">Salvar vídeo</button>
          </div>

          <div className="border-t border-rjb-yellow/20 pt-3 space-y-2">
            {groupedYoutube.length === 0 ? (
              <p className="text-xs opacity-60">Nenhum vídeo cadastrado na área administrativa.</p>
            ) : (
              groupedYoutube.map(([pKey, items]) => (
                <details key={pKey} open className="rounded-lg border border-rjb-yellow/20 bg-rjb-bg-light/30 dark:bg-rjb-bg-dark/30">
                  <summary className="px-3 py-2 text-xs font-semibold cursor-pointer flex justify-between">
                    <span>{pKey === LEGACY_PERIOD ? 'Sem período' : formatPeriodLabel(pKey)}</span>
                    <span>{items.length}</span>
                  </summary>
                  <div className="p-3 border-t border-rjb-yellow/10 space-y-2">
                    {items.map((v) => (
                      <div key={v.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 text-xs">
                        <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeId)}`} target="_blank" rel="noopener noreferrer" className="text-rjb-yellow hover:underline min-w-0 truncate" title={v.title}>
                          {v.title} ({v.category === 'apresentacao' ? 'Apresentação' : 'Bastidor'} - {v.visibility === 'public' ? 'Público' : 'Não listado'})
                        </a>
                        <button type="button" onClick={() => handleDeleteYoutube(v.id)} className="text-red-500 hover:text-red-700 font-bold shrink-0 self-start sm:self-auto">Excluir</button>
                      </div>
                    ))}
                  </div>
                </details>
              ))
            )}
          </div>
        </form>

        <details className="rounded-xl border border-stone-300/40 dark:border-stone-600/50 bg-rjb-bg-light/80 dark:bg-rjb-bg-dark/50 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-rjb-text dark:text-rjb-text-dark">
            Visão consolidada por período (estático + envios admin)
          </summary>
          <div className="px-4 pb-4 space-y-3 border-t border-rjb-yellow/15">
            <div className="pt-3">
              <label className="text-xs font-semibold text-rjb-text dark:text-rjb-text-dark">Período de referência</label>
              <select
                value={referencePeriodKey}
                onChange={(e) => setReferencePeriodKey(e.target.value)}
                className="mt-1.5 w-full sm:w-64 p-2.5 text-sm border border-rjb-yellow/30 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-rjb-yellow/20 px-3 py-2 bg-rjb-bg-light/40 dark:bg-rjb-bg-dark/40">
                <span className="opacity-70">Fotos estáticas</span>
                <p className="font-bold mt-0.5">{staticByReferencePeriod.photos.length}</p>
              </div>
              <div className="rounded-lg border border-rjb-yellow/20 px-3 py-2 bg-rjb-bg-light/40 dark:bg-rjb-bg-dark/40">
                <span className="opacity-70">Vídeos estáticos</span>
                <p className="font-bold mt-0.5">{staticByReferencePeriod.bastidorVideos.length + staticByReferencePeriod.apresentacaoVideos.length}</p>
              </div>
              <div className="rounded-lg border border-rjb-yellow/20 px-3 py-2 bg-rjb-bg-light/40 dark:bg-rjb-bg-dark/40">
                <span className="opacity-70">Fotos enviadas (admin)</span>
                <p className="font-bold mt-0.5">{uploadedByReferencePeriod.length}</p>
              </div>
            </div>

            {(staticByReferencePeriod.photos.length > 0 || uploadedByReferencePeriod.length > 0) && (
              <div className="space-y-2">
                {staticByReferencePeriod.photos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-rjb-text dark:text-rjb-text-dark">Fotos estáticas</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {staticByReferencePeriod.photos.map((ph) => (
                        <a key={ph.key} href={ph.url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-rjb-yellow/30">
                          <img src={ph.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {uploadedByReferencePeriod.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-rjb-text dark:text-rjb-text-dark">Fotos enviadas na admin</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {uploadedByReferencePeriod.map((att) => (
                        <a key={att.name} href={att.downloadUrl} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-emerald-400/40">
                          <img src={att.downloadUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasAnyStaticByReferencePeriod && uploadedByReferencePeriod.length === 0 && (
              <p className="text-xs text-rjb-text/55 dark:text-rjb-text-dark/55">
                Nenhuma mídia encontrada no período selecionado.
              </p>
            )}
          </div>
        </details>

        <div className="rounded-xl border border-rjb-yellow/25 bg-rjb-yellow/5 px-4 py-3">
          <p className="text-sm font-semibold text-rjb-text dark:text-rjb-text-dark">Gestão de fotos enviadas (GCS ou R2)</p>
        </div>

        <div className="space-y-3">
          {groupedByPeriod.length === 0 ? (
            <p className="text-center opacity-50 text-sm">Nenhuma foto encontrada.</p>
          ) : (
            groupedByPeriod.map(([pKey, items]) => (
              <details key={pKey} open className="border border-rjb-yellow/20 rounded-xl bg-rjb-bg-light/40 dark:bg-rjb-bg-dark/40 overflow-hidden">
                <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-sm bg-rjb-yellow/5 flex items-center justify-between gap-2">
                  <span>{pKey === LEGACY_PERIOD ? 'Sem período (envios antigos)' : formatPeriodLabel(pKey)}</span>
                  <span className="text-xs opacity-70">{items.length} arquivo(s)</span>
                </summary>
                <div className="p-3 pt-0 space-y-2 sm:space-y-3 border-t border-rjb-yellow/10">
                  {items.map((attachment) => (
                    <div key={attachment.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-rjb-bg-light dark:bg-rjb-bg-dark rounded-lg border border-rjb-yellow/10">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate max-w-[min(100%,280px)]">{displayName(attachment.name)}</span>
                        <span className="text-[10px] opacity-50">{new Date(attachment.uploaded).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 shrink-0 sm:justify-end">
                        <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-rjb-yellow hover:underline text-xs font-bold">Ver / baixar</a>
                        <button type="button" onClick={() => openEdit(attachment)} className="text-stone-700 dark:text-stone-200 hover:text-rjb-yellow text-xs font-bold">Editar</button>
                        <button type="button" onClick={() => handleDelete(attachment.name)} className="text-red-500 hover:text-red-700 text-xs font-bold">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      {editing &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="presentation" onClick={(ev) => ev.target === ev.currentTarget && closeEdit()}>
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border-2 border-rjb-yellow/40 bg-rjb-card-light dark:bg-rjb-card-dark shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h4 className="text-lg font-bold">Editar foto</h4>
                <button type="button" onClick={closeEdit} className="shrink-0 rounded-lg px-2 py-1 text-sm">✕</button>
              </div>
              <p className="text-xs break-all mb-4">{displayName(editing.name)}</p>

              <label className="block text-xs font-semibold mb-1.5">Período (mês da galeria)</label>
              <select value={editPeriodKey} onChange={(e) => setEditPeriodKey(e.target.value)} className="w-full p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark">
                {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <button type="button" onClick={handleMovePeriod} className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold border-2 border-rjb-yellow/50">Aplicar mudança de período</button>

              <form onSubmit={handleReplaceFile} className="pt-4 mt-4 border-t border-rjb-yellow/20">
                <p className="text-xs font-semibold mb-2">Substituir foto</p>
                <input type="file" accept="image/*" onChange={(e) => setReplaceFile(e.target.files?.[0] || null)} className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-rjb-yellow file:text-rjb-text" />
                <button type="submit" className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text">Substituir por esta foto</button>
              </form>

              <button type="button" onClick={() => handleDelete(editing.name)} className="w-full py-2 mt-3 text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Excluir esta foto...</button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default AttachmentsManagement
