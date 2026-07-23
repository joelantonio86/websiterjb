import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import ConfirmationDialog from '../ConfirmationDialog'
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
  const [files, setFiles] = useState([])
  const [filePreviewUrls, setFilePreviewUrls] = useState([])
  const [periodKey, setPeriodKey] = useState(() => periods[0]?.id || '2025-12')
  const fileInputRef = useRef(null)

  const [editing, setEditing] = useState(null)
  const [editPeriodKey, setEditPeriodKey] = useState('2025-12')
  const [replaceFile, setReplaceFile] = useState(null)

  // Lightbox de pré-visualização das fotos
  const [previewPhoto, setPreviewPhoto] = useState(null)

  // Confirmações de exclusão (fotos e vídeos)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteYoutubeTarget, setDeleteYoutubeTarget] = useState(null)

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

  // Gera miniaturas reais (preview instantâneo) das fotos selecionadas antes do upload.
  // Sempre revoga as URLs antigas para não vazar memória (blob URLs ficam vivos até serem revogados).
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setFilePreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files || [])
    if (newFiles.length === 0) return

    // Acumula com o que já estava selecionado (em vez de substituir), pois o seletor
    // nativo do sistema operacional substitui a seleção anterior sempre que é reaberto
    // — isso garante que todas as fotos escolhidas (mesmo em rodadas separadas)
    // continuem na lista, evitando duplicadas pelo nome + tamanho + data de modificação.
    setFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`))
      const merged = [...prev]
      newFiles.forEach((f) => {
        const key = `${f.name}-${f.size}-${f.lastModified}`
        if (!existingKeys.has(key)) {
          merged.push(f)
          existingKeys.add(key)
        }
      })
      return merged
    })

    // Limpa o valor do input para permitir reabrir o seletor e adicionar mais fotos depois
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeSelectedFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (files.length === 0) return showMessage('Selecione ao menos uma foto para upload.', true)
    if (!periodKey) return showMessage('Selecione o período.', true)

    showLoader(true, files.length > 1 ? `Enviando ${files.length} fotos...` : 'Enviando foto...')
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    formData.append('periodKey', periodKey)

    try {
      // Importante: NÃO definir 'Content-Type' manualmente aqui. Ao enviar um FormData,
      // o navegador precisa gerar o header com o "boundary" correto automaticamente.
      // Se forçarmos 'multipart/form-data' sem boundary, o boundary não é preenchido
      // e o multer no backend pode falhar ao separar corretamente os múltiplos arquivos.
      const response = await api.post('/api/attachments/upload', formData)
      const { uploaded = [], errors = [] } = response.data || {}

      if (errors.length > 0 && uploaded.length > 0) {
        showMessage(
          `${uploaded.length} foto(s) enviada(s) com sucesso. ${errors.length} falharam: ${errors.map((er) => er.originalName).join(', ')}.`,
          true
        )
      } else if (errors.length > 0) {
        showMessage('Nenhuma foto pôde ser enviada. Verifique os arquivos selecionados.', true)
      } else {
        showMessage(uploaded.length > 1 ? `${uploaded.length} fotos enviadas com sucesso!` : 'Foto enviada com sucesso!')
      }

      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchAttachments()
    } catch (error) {
      const msg = error.response?.data?.message
      showMessage(msg || 'Erro ao enviar fotos.', true)
    } finally {
      showLoader(false)
    }
  }

  const handleDeleteRequest = useCallback((attachment) => {
    setDeleteTarget(attachment)
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const fileName = deleteTarget.name
    showLoader(true, 'Excluindo foto...')
    try {
      await api.delete(`/api/attachments/delete/${encodeURIComponent(fileName)}`)
      showMessage('Foto excluída com sucesso!')
      setEditing((prev) => (prev?.name === fileName ? null : prev))
      setPreviewPhoto((prev) => (prev?.name === fileName ? null : prev))
      fetchAttachments()
    } catch {
      showMessage('Erro ao excluir foto.', true)
    } finally {
      showLoader(false)
      setDeleteTarget(null)
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

  useEffect(() => {
    if (!previewPhoto) return
    const onKey = (ev) => ev.key === 'Escape' && setPreviewPhoto(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewPhoto])

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
      await api.post('/api/attachments/replace', formData)
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

  const handleDeleteYoutubeConfirm = async () => {
    if (!deleteYoutubeTarget) return
    showLoader(true, 'Removendo vídeo...')
    try {
      await api.delete(`/api/admin/youtube-videos/${encodeURIComponent(deleteYoutubeTarget.id)}`)
      showMessage('Vídeo removido com sucesso!')
      fetchYoutubeVideos()
    } catch {
      showMessage('Erro ao remover vídeo.', true)
    } finally {
      showLoader(false)
      setDeleteYoutubeTarget(null)
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
        <p className="text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mt-0.5">Fotos por upload (múltiplas de uma vez) e vídeos por link do YouTube (não listado ok)</p>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        <form onSubmit={handleUpload} className="p-4 sm:p-5 border-2 border-dashed border-rjb-yellow/50 rounded-xl bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/30">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)} className="w-full sm:min-w-[200px] sm:w-auto p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark">
              {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesChange}
              className="w-full sm:flex-1 p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rjb-yellow file:text-rjb-text"
            />
            <button type="submit" disabled={files.length === 0} className="w-full sm:w-auto bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-3 px-6 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {files.length > 1 ? `Enviar ${files.length} fotos` : 'Enviar foto'}
            </button>
          </div>

          {files.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rjb-text dark:text-rjb-text-dark mt-3 mb-2">
                {files.length} foto{files.length !== 1 ? 's' : ''} selecionada{files.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {files.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}-${f.lastModified}`}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-rjb-yellow/30 bg-rjb-bg-dark/10"
                  >
                    {filePreviewUrls[idx] && (
                      <img
                        src={filePreviewUrls[idx]}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center text-sm leading-none transition-colors"
                      aria-label={`Remover ${f.name} da seleção`}
                    >
                      &times;
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate">
                      {f.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] sm:text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-2">Dica: selecione várias fotos de uma vez (segure Ctrl ou Cmd para marcar mais de uma no seletor do sistema) ou abra o seletor novamente para ir adicionando mais — todas ficam na lista abaixo até você enviar. Prefira imagens até 2MB para carregamento mais rápido no celular.</p>
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
            <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-2.5 px-5 rounded-xl text-sm">Salvar vídeo</button>
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
                        <button type="button" onClick={() => setDeleteYoutubeTarget(v)} className="text-red-500 hover:text-red-700 font-bold shrink-0 self-start sm:self-auto py-1.5 px-2 rounded-md hover:bg-red-500/10">Excluir</button>
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
                        <button
                          type="button"
                          key={ph.key}
                          onClick={() => setPreviewPhoto({ name: ph.key, downloadUrl: ph.url })}
                          className="block w-20 h-20 rounded-lg overflow-hidden border border-rjb-yellow/30 hover:border-rjb-yellow transition-colors"
                        >
                          <img src={ph.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {uploadedByReferencePeriod.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-rjb-text dark:text-rjb-text-dark">Fotos enviadas na admin</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {uploadedByReferencePeriod.map((att) => (
                        <button
                          type="button"
                          key={att.name}
                          onClick={() => setPreviewPhoto(att)}
                          className="block w-20 h-20 rounded-lg overflow-hidden border border-emerald-400/40 hover:border-emerald-400 transition-colors"
                        >
                          <img src={att.downloadUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
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
                    <div key={attachment.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-rjb-bg-light dark:bg-rjb-bg-dark rounded-lg border border-rjb-yellow/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(attachment)}
                          className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-rjb-yellow/30 hover:border-rjb-yellow transition-colors"
                          aria-label={`Visualizar ${displayName(attachment.name)}`}
                        >
                          <img src={attachment.downloadUrl} alt={displayName(attachment.name)} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate max-w-[min(100%,220px)]">{displayName(attachment.name)}</span>
                          <span className="text-[10px] opacity-50">{new Date(attachment.uploaded).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0 sm:justify-end">
                        <button type="button" onClick={() => setPreviewPhoto(attachment)} className="text-rjb-yellow hover:underline text-xs font-bold py-1.5 px-2 rounded-md hover:bg-rjb-yellow/10">Visualizar</button>
                        <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-stone-700 dark:text-stone-200 hover:text-rjb-yellow text-xs font-bold py-1.5 px-2 rounded-md hover:bg-rjb-yellow/10">Baixar</a>
                        <button type="button" onClick={() => openEdit(attachment)} className="text-stone-700 dark:text-stone-200 hover:text-rjb-yellow text-xs font-bold py-1.5 px-2 rounded-md hover:bg-rjb-yellow/10">Editar</button>
                        <button type="button" onClick={() => handleDeleteRequest(attachment)} className="text-red-500 hover:text-red-700 text-xs font-bold py-1.5 px-2 rounded-md hover:bg-red-500/10">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      {/* Modal de edição de foto (mover período / substituir) */}
      {editing &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="presentation" onClick={(ev) => ev.target === ev.currentTarget && closeEdit()}>
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border-2 border-rjb-yellow/40 bg-rjb-card-light dark:bg-rjb-card-dark shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h4 className="text-lg font-bold">Editar foto</h4>
                <button type="button" onClick={closeEdit} className="shrink-0 rounded-lg px-2 py-1 text-sm">✕</button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPhoto(editing)}
                className="block w-full h-40 rounded-xl overflow-hidden border border-rjb-yellow/30 mb-3 hover:border-rjb-yellow transition-colors"
              >
                <img src={editing.downloadUrl} alt={displayName(editing.name)} className="w-full h-full object-cover" />
              </button>
              <p className="text-xs break-all mb-4 opacity-70">{displayName(editing.name)}</p>

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

              <button
                type="button"
                onClick={() => { handleDeleteRequest(editing); closeEdit() }}
                className="w-full py-2 mt-3 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
              >
                Excluir esta foto...
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Lightbox de pré-visualização das fotos */}
      {previewPhoto &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
            role="presentation"
            onClick={(ev) => ev.target === ev.currentTarget && setPreviewPhoto(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl leading-none transition-colors"
              aria-label="Fechar visualização"
            >
              &times;
            </button>
            <figure className="max-w-full max-h-full flex flex-col items-center gap-3">
              <img
                src={previewPhoto.downloadUrl}
                alt={displayName(previewPhoto.name)}
                className="max-w-[92vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <figcaption className="text-white/80 text-xs sm:text-sm text-center px-2">
                {displayName(previewPhoto.name)}
              </figcaption>
            </figure>
          </div>,
          document.body
        )}

      {/* Confirmação de exclusão de foto */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir foto"
        message={`Tem certeza que deseja excluir "${deleteTarget ? displayName(deleteTarget.name) : ''}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Confirmação de exclusão de vídeo do YouTube */}
      <ConfirmationDialog
        isOpen={Boolean(deleteYoutubeTarget)}
        onClose={() => setDeleteYoutubeTarget(null)}
        onConfirm={handleDeleteYoutubeConfirm}
        title="Remover vídeo"
        message={`Tem certeza que deseja remover o vídeo "${deleteYoutubeTarget?.title || ''}" da lista administrativa? Ele deixará de aparecer no site.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default AttachmentsManagement