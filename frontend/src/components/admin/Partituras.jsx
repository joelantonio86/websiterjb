import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../services/api'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import ConfirmationDialog from '../ConfirmationDialog'
import EmptyState from '../EmptyState'
import SkeletonLoader from '../SkeletonLoader'
import PartituraFormModal from './PartituraFormModal'
import { racionais as staticRacionais, diversas as staticDiversas } from '../../data/songs'

const SECTIONS = [
  { folder: 'racionais', title: 'Músicas Racionais', accent: 'border-rjb-yellow' },
  { folder: 'diversas', title: 'Outros clássicos', accent: 'border-blue-500' },
]

const Partituras = () => {
  const [partituras, setPartituras] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPartitura, setEditingPartitura] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteFilesToo, setDeleteFilesToo] = useState(false)
  const [importing, setImporting] = useState(false)

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

  const grouped = useMemo(() => {
    const byFolder = { racionais: [], diversas: [] }
    for (const p of partituras) {
      const folder = p.folder === 'racionais' ? 'racionais' : 'diversas'
      byFolder[folder].push(p)
    }
    byFolder.racionais.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'pt'))
    byFolder.diversas.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'pt'))
    return byFolder
  }, [partituras])

  const openCreateModal = () => {
    setEditingPartitura(null)
    setModalOpen(true)
  }

  const openEditModal = (partitura) => {
    setEditingPartitura(partitura)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingPartitura(null)
  }

  const handleModalSuccess = () => {
    closeModal()
    fetchPartituras()
  }

  const openDelete = (partitura) => {
    setDeleteFilesToo(false)
    setDeleteTarget(partitura)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
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

  const renderCard = (partitura) => (
    <div
      key={partitura.id}
      className="rounded-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-l-4 border-rjb-yellow shadow-lg hover:shadow-xl transition-all duration-300 p-5 flex flex-col gap-3"
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
        </div>
        <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-rjb-yellow/20 text-rjb-yellow whitespace-nowrap">
          {[partitura.hasPdf !== false && 'PDF', partitura.hasSib && 'SIB'].filter(Boolean).join(' + ') || '—'}
        </span>
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
          {partituras.length} partitura{partituras.length !== 1 ? 's' : ''} · {grouped.racionais.length} racionais · {grouped.diversas.length} diversas
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
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold text-sm hover:from-yellow-500 hover:to-yellow-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nova partitura
          </button>
        </div>
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
      ) : (
        <div className="space-y-8">
          {SECTIONS.map(({ folder, title, accent }) => {
            const items = grouped[folder] || []
            return (
              <section key={folder} className="space-y-3">
                <div className={`flex items-center justify-between gap-3 border-l-4 ${accent} pl-3`}>
                  <h3 className="text-base sm:text-lg font-extrabold text-rjb-text dark:text-rjb-text-dark">
                    {title}
                  </h3>
                  <span className="text-xs font-semibold text-rjb-text/60 dark:text-rjb-text-dark/60">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-rjb-text/50 dark:text-rjb-text-dark/50 pl-4">
                    Nenhuma partitura nesta pasta.
                  </p>
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
          onClose={closeModal}
          onSuccess={handleModalSuccess}
        />
      )}

      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null)
          setDeleteFilesToo(false)
        }}
        onConfirm={handleDeleteConfirm}
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
                onChange={(e) => setDeleteFilesToo(e.target.checked)}
              />
              <span>
                Apagar também os ficheiros <strong>PDF/SIB no Cloudflare</strong>.
                <span className="block text-red-600 dark:text-red-400 mt-1">
                  Atenção: isto remove do bucket de produção. No catálogo importado, normalmente NÃO marques.
                </span>
              </span>
            </label>
          </div>
        }
        confirmLabel={deleteFilesToo ? 'Excluir tudo' : 'Remover do catálogo'}
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default Partituras
