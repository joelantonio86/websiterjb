import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import ConfirmationDialog from '../ConfirmationDialog'
import EmptyState from '../EmptyState'
import SkeletonLoader from '../SkeletonLoader'
import RepertorioFormModal from './RepertorioFormModal'

const formatDate = (dateStr) => {
  if (!dateStr) return 'Data não informada'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

const Repertorios = () => {
  const [repertorios, setRepertorios] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRepertorio, setEditingRepertorio] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const fetchRepertorios = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get('/api/admin/repertorios')
      setRepertorios(Array.isArray(data) ? data : [])
    } catch (error) {
      setLoadError(true)
      showMessage(error.response?.data?.message || 'Erro ao carregar repertórios.', true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRepertorios()
  }, [fetchRepertorios])

  const openCreateModal = () => {
    setEditingRepertorio(null)
    setModalOpen(true)
  }

  const openEditModal = (repertorio) => {
    setEditingRepertorio(repertorio)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingRepertorio(null)
  }

  const handleModalSuccess = () => {
    closeModal()
    fetchRepertorios()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    showLoader(true, 'Excluindo repertório...')
    try {
      await api.delete(`/api/admin/repertorios/${deleteTarget.id}`)
      showMessage('Repertório excluído com sucesso!')
      fetchRepertorios()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao excluir repertório.', true)
    } finally {
      showLoader(false)
      setDeleteTarget(null)
    }
  }

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
          {repertorios.length} repertório{repertorios.length !== 1 ? 's' : ''} cadastrado{repertorios.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold text-sm hover:from-yellow-500 hover:to-yellow-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Novo repertório
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : loadError ? (
        <EmptyState
          icon="⚠️"
          variant="error"
          title="Não foi possível carregar os repertórios"
          description="Verifique sua conexão e tente novamente."
          actionLabel="Tentar novamente"
          onAction={fetchRepertorios}
        />
      ) : repertorios.length === 0 ? (
        <EmptyState
          icon="🎼"
          title="Nenhum repertório criado"
          description="Clique em 'Novo repertório' para cadastrar o primeiro repertório de apresentação."
          actionLabel="Novo repertório"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {repertorios.map((repertorio) => {
            const isExpanded = expandedId === repertorio.id
            const songs = repertorio.songs || []
            return (
              <div
                key={repertorio.id}
                className="rounded-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-l-4 border-rjb-yellow shadow-lg hover:shadow-xl transition-all duration-300 p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-rjb-text dark:text-rjb-text-dark break-words">
                      {repertorio.name}
                    </h3>
                    <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
                      📅 {formatDate(repertorio.date)}
                    </p>
                    {repertorio.location && (
                      <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
                        📍 {repertorio.location}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-rjb-yellow/20 text-rjb-yellow whitespace-nowrap">
                    {songs.length} música{songs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {songs.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(repertorio.id)}
                      className="text-xs font-semibold text-rjb-yellow hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? 'Ocultar músicas' : 'Ver músicas'}
                      <svg
                        className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                        {songs.map((song, idx) => (
                          <li
                            key={`${song.folder}-${song.mp3}-${idx}`}
                            className="text-sm text-rjb-text/80 dark:text-rjb-text-dark/80 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rjb-yellow flex-shrink-0"></span>
                            {song.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2 mt-auto border-t border-rjb-yellow/20">
                  <button
                    type="button"
                    onClick={() => openEditModal(repertorio)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-rjb-yellow/50 text-sm font-semibold text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(repertorio)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/40 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <RepertorioFormModal
          repertorio={editingRepertorio}
          onClose={closeModal}
          onSuccess={handleModalSuccess}
        />
      )}

      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir repertório"
        message={`Tem certeza que deseja excluir o repertório "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default Repertorios
