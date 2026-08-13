import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import api from '../../services/api'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import ConfirmationDialog from '../ConfirmationDialog'
import EmptyState from '../EmptyState'
import SkeletonLoader from '../SkeletonLoader'
import PartituraFormModal from './PartituraFormModal'
import { racionais as staticRacionais, diversas as staticDiversas } from '../../data/songs'

const SECTIONS = [
  { folder: 'racionais', title: 'Músicas Racionais', accent: 'border-rjb-yellow', btn: 'Nova racional' },
  { folder: 'diversas', title: 'Outros clássicos', accent: 'border-blue-500', btn: 'Nova diversa' },
]

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const Partituras = () => {
  const [partituras, setPartituras] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPartitura, setEditingPartitura] = useState(null)
  const [defaultFolder, setDefaultFolder] = useState('diversas')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteFilesToo, setDeleteFilesToo] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [importing, setImporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [folderFilter, setFolderFilter] = useState('all') // all | racionais | diversas
  const [highlightId, setHighlightId] = useState(null)
  const highlightTimer = useRef(null)

  const fetchPartituras = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get('/api/admin/partituras')
      setPartituras(Array.isArray(data) ? data : [])
    } catch (error) {
      setLoadError(true)
      showMessage(error.response?.data?.message || 'Erro ao carregar partituras.', true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPartituras()
  }, [fetchPartituras])

  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
  }, [])

  const filtered = useMemo(() => {
    const term = normalize(searchTerm)
    return partituras.filter((p) => {
      const folder = p.folder === 'racionais' ? 'racionais' : 'diversas'
      if (folderFilter !== 'all' && folder !== folderFilter) return false
      if (!term) return true
      return (
        normalize(p.title || p.name).includes(term) ||
        normalize(p.mp3).includes(term)
      )
    })
  }, [partituras, searchTerm, folderFilter])

  const grouped = useMemo(() => {
    const byFolder = { racionais: [], diversas: [] }
    for (const p of filtered) {
      const folder = p.folder === 'racionais' ? 'racionais' : 'diversas'
      byFolder[folder].push(p)
    }
    byFolder.racionais.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'pt'))
    byFolder.diversas.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'pt'))
    return byFolder
  }, [filtered])

  const flashHighlight = (id) => {
    setHighlightId(id)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightId(null), 3500)
    requestAnimationFrame(() => {
      const el = document.getElementById(`partitura-card-${id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const openCreateModal = (folder = 'diversas') => {
    setEditingPartitura(null)
    setDefaultFolder(folder)
    setModalOpen(true)
  }

  const openEditModal = (partitura) => {
    setEditingPartitura(partitura)
    setDefaultFolder(partitura.folder || 'diversas')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPartitura(null)
  }

  const handleModalSuccess = async (savedId) => {
    closeModal()
    await fetchPartituras()
    if (savedId) {
      // pequeno delay para o DOM renderizar a lista
      setTimeout(() => flashHighlight(savedId), 80)
    }
  }

  const openDelete = (partitura) => {
    setDeleteFilesToo(false)
    setDeleteConfirmText('')
    setDeleteTarget(partitura)
  }

  const canConfirmDelete = !deleteFilesToo || deleteConfirmText.trim().toUpperCase() === 'EXCLUIR'

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !canConfirmDelete) return
    showLoader(true, deleteFilesToo ? 'Excluindo partitura e ficheiros no R2...' : 'Removendo do catálogo...')
    try {
      const qs = deleteFilesToo ? '?deleteFiles=true' : ''
      const { data } = await api.delete(`/api/admin/partituras/${deleteTarget.id}${qs}`)
      showMessage(data.message || 'Partitura excluída com sucesso!')
      fetchPartituras()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao excluir partitura.', true)
    } finally {
      showLoader(false)
      setDeleteTarget(null)
      setDeleteFilesToo(false)
      setDeleteConfirmText('')
    }
  }

  const handleImportCatalog = async () => {
    setImporting(true)
    showLoader(true, 'Importando catálogo atual...')
    try {
      const items = [
        ...staticRacionais.map((s) => ({ ...s, folder: 'racionais' })),
        ...staticDiversas.map((s) => ({ ...s, folder: 'diversas' })),
      ]
      const { data } = await api.post('/api/admin/partituras/import-catalog', { items })
      showMessage(data.message || 'Catálogo importado.')
      fetchPartituras()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao importar catálogo.', true)
    } finally {
      showLoader(false)
      setImporting(false)
    }
  }

  const renderCard = (partitura) => {
    const isHighlighted = highlightId === partitura.id
    return (
      <div
        id={`partitura-card-${partitura.id}`}
        key={partitura.id}
        className={`rounded-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-l-4 border-rjb-yellow shadow-lg hover:shadow-xl transition-all duration-300 p-5 flex flex-col gap-3 ${
          isHighlighted ? 'ring-2 ring-rjb-yellow scale-[1.01]' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-rjb-text dark:text-rjb-text-dark break-words">
              {partitura.title || partitura.name}
            </h3>
            <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1 truncate">
              {partitura.mp3}
              {partitura.time ? ` · ${partitura.time}` : ''}
            </p>
            <p className="text-[11px] text-rjb-text/45 dark:text-rjb-text-dark/45 mt-1 font-mono truncate">
              {partitura.folder}/pdf/{partitura.mp3}.pdf
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-rjb-yellow/20 text-rjb-yellow whitespace-nowrap">
              {[partitura.hasPdf !== false && 'PDF', partitura.hasSib && 'SIB'].filter(Boolean).join(' + ') || '—'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-rjb-text/50 dark:text-rjb-text-dark/50">
              Catálogo
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {partitura.pdfUrl && (
            <a href={partitura.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-rjb-yellow hover:underline">
              Abrir PDF
            </a>
          )}
          {partitura.sibUrl && (
            <a href={partitura.sibUrl} target="_blank" rel="noopener noreferrer" className="text-rjb-yellow hover:underline">
              Abrir SIB
            </a>
          )}
        </div>

        <div className="flex gap-2 pt-2 mt-auto border-t border-rjb-yellow/20">
          <button
            type="button"
            onClick={() => openEditModal(partitura)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-rjb-yellow/50 text-sm font-semibold text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 transition-colors"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => openDelete(partitura)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/40 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    )
  }

  const visibleSections = SECTIONS.filter((s) => folderFilter === 'all' || folderFilter === s.folder)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
            {filtered.length} visível{filtered.length !== 1 ? 'eis' : ''} · {partituras.length} no total · {grouped.racionais.length} racionais · {grouped.diversas.length} diversas
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {partituras.length === 0 && (
              <button
                type="button"
                onClick={handleImportCatalog}
                disabled={importing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rjb-yellow/50 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm hover:bg-rjb-yellow/10 transition-colors disabled:opacity-60"
              >
                Importar catálogo do site
              </button>
            )}
          </div>
        </div>

        {partituras.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome ou ficheiro…"
                className="w-full p-3 pl-10 text-sm rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow"
              />
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rjb-text/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'racionais', label: 'Racionais' },
                { id: 'diversas', label: 'Diversas' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFolderFilter(f.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    folderFilter === f.id
                      ? 'bg-rjb-yellow text-rjb-text border-rjb-yellow'
                      : 'border-rjb-yellow/40 text-rjb-text/70 dark:text-rjb-text-dark/70 hover:bg-rjb-yellow/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <SkeletonLoader type="card" count={4} />
      ) : loadError ? (
        <EmptyState
          icon="⚠️"
          title="Não foi possível carregar"
          description="Verifique a API e tente novamente."
          actionLabel="Tentar de novo"
          onAction={fetchPartituras}
        />
      ) : partituras.length === 0 ? (
        <EmptyState
          icon="🎼"
          title="Nenhuma partitura no banco"
          description="Importe o catálogo atual do site (PDF/SIB já no Cloudflare) ou cadastre a primeira partitura."
          actionLabel="Importar catálogo do site"
          onAction={handleImportCatalog}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="Nenhum resultado"
          description="Ajuste a pesquisa ou o filtro de pasta."
          actionLabel="Limpar filtros"
          onAction={() => {
            setSearchTerm('')
            setFolderFilter('all')
          }}
        />
      ) : (
        <div className="space-y-8">
          {visibleSections.map(({ folder, title, accent, btn }) => {
            const items = grouped[folder] || []
            return (
              <section key={folder} className="space-y-3">
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-l-4 ${accent} pl-3`}>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-rjb-text dark:text-rjb-text-dark">
                      {title}
                    </h3>
                    <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60">
                      {items.length} item{items.length !== 1 ? 's' : ''} nesta vista
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateModal(folder)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold text-xs sm:text-sm hover:from-yellow-500 hover:to-yellow-600 shadow transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    {btn}
                  </button>
                </div>
                {items.length === 0 ? (
                  <div className="pl-4 py-4 rounded-xl border border-dashed border-rjb-yellow/30 bg-rjb-bg-light/40 dark:bg-rjb-bg-dark/20">
                    <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mb-2">
                      Nenhuma partitura nesta pasta{searchTerm ? ' com os filtros actuais' : ''}.
                    </p>
                    {!searchTerm && (
                      <button
                        type="button"
                        onClick={() => openCreateModal(folder)}
                        className="text-sm font-semibold text-rjb-yellow hover:underline"
                      >
                        Adicionar nesta pasta
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {items.map(renderCard)}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <PartituraFormModal
          partitura={editingPartitura}
          defaultFolder={defaultFolder}
          onClose={closeModal}
          onSuccess={handleModalSuccess}
        />
      )}

      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null)
          setDeleteFilesToo(false)
          setDeleteConfirmText('')
        }}
        onConfirm={handleDeleteConfirm}
        confirmDisabled={!canConfirmDelete}
        title="Excluir partitura"
        message={
          <div className="space-y-3 text-left">
            <p>
              Remover <strong>&quot;{deleteTarget?.title || deleteTarget?.name}&quot;</strong> do catálogo?
            </p>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={deleteFilesToo}
                onChange={(e) => {
                  setDeleteFilesToo(e.target.checked)
                  setDeleteConfirmText('')
                }}
              />
              <span>
                Apagar também os ficheiros <strong>PDF/SIB no Cloudflare</strong>.
                <span className="block text-red-600 dark:text-red-400 mt-1">
                  Atenção: remove do bucket de produção. No catálogo importado, normalmente NÃO marques.
                </span>
              </span>
            </label>
            {deleteFilesToo && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Para confirmar, escreve <code className="text-red-600">EXCLUIR</code>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full p-2.5 text-sm rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-red-500/40 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-red-500/40"
                  autoComplete="off"
                />
              </div>
            )}
          </div>
        }
        confirmLabel={deleteFilesToo ? 'Excluir tudo no Cloudflare' : 'Remover do catálogo'}
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default Partituras
