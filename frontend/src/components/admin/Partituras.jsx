import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import ConfirmationDialog from '../ConfirmationDialog'
import EmptyState from '../EmptyState'
import SkeletonLoader from '../SkeletonLoader'
import PartituraFormModal from './PartituraFormModal'
import { racionais as staticRacionais, diversas as staticDiversas } from '../../data/songs'

const folderLabel = (folder) => (folder === 'racionais' ? 'Racionais' : 'Outros clássicos')

const Partituras = () => {
  const [partituras, setPartituras] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPartitura, setEditingPartitura] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    showLoader(true, 'Excluindo partitura...')
    try {
      await api.delete(`/api/admin/partituras/${deleteTarget.id}`)
      showMessage('Partitura excluída com sucesso!')
      fetchPartituras()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao excluir partitura.', true)
    } finally {
      showLoader(false)
      setDeleteTarget(null)
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
          {partituras.length} partitura{partituras.length !== 1 ? 's' : ''} cadastrada{partituras.length !== 1 ? 's' : ''}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {partituras.map((partitura) => (
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
                    {folderLabel(partitura.folder)} · {partitura.mp3}
                    {partitura.time ? ` · ${partitura.time}` : ''}
                  </p>
                </div>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-rjb-yellow/20 text-rjb-yellow whitespace-nowrap">
                  {[partitura.hasPdf !== false && 'PDF', partitura.hasSib && 'SIB'].filter(Boolean).join(' + ') || '—'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {partitura.pdfUrl && (
                  <a
                    href={partitura.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rjb-yellow hover:underline"
                  >
                    Abrir PDF
                  </a>
                )}
                {partitura.sibUrl && (
                  <a
                    href={partitura.sibUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rjb-yellow hover:underline"
                  >
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
                  onClick={() => setDeleteTarget(partitura)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/40 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
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
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir partitura"
        message={`Tem certeza que deseja excluir "${deleteTarget?.title || deleteTarget?.name}"? Os ficheiros PDF/SIB no armazenamento também serão removidos.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default Partituras
