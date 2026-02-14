import { useState } from 'react'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import api from '../../services/api'

const DeleteMemberModal = ({ member, onClose, onSuccess }) => {
  const [confirmName, setConfirmName] = useState('')
  const [error, setError] = useState(false)

  const handleConfirmChange = (e) => {
    const value = e.target.value
    setConfirmName(value)
    setError(false)
  }

  const handleDelete = async () => {
    if (confirmName.trim() !== member.name.trim()) {
      setError(true)
      return
    }

    showLoader(true, 'Excluindo membro...')

    try {
      await api.delete(`/api/admin/delete-member/${member.id}`)
      showMessage('Membro excluído com sucesso!')
      onSuccess()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao excluir membro.', true)
    } finally {
      showLoader(false)
    }
  }

  if (!member) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-80 z-[95] flex items-center justify-center transition-opacity duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm mx-auto p-6 bg-rjb-card-light dark:bg-rjb-card-dark rounded-xl border border-red-500/30 text-center"
      >
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Confirmar Exclusão</h3>
        <p className="text-sm opacity-70 mb-4">Esta ação não pode ser desfeita. Deseja realmente excluir o membro:</p>
        <p className="text-base font-bold mb-4 text-rjb-text dark:text-rjb-text-dark bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          {member.name}
        </p>
        <div className="mb-4">
          <label htmlFor="confirm-delete-name" className="block text-sm font-medium mb-2 text-rjb-text dark:text-rjb-text-dark">
            Digite o nome completo para confirmar:
          </label>
          <input
            type="text"
            id="confirm-delete-name"
            value={confirmName}
            onChange={handleConfirmChange}
            className={`w-full p-3 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border ${
              error ? 'border-red-500' : 'border-red-300 dark:border-red-600'
            } text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-red-500 transition-all`}
            placeholder="Digite o nome completo do membro"
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Os nomes não coincidem</p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmName.trim() !== member.name.trim()}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteMemberModal
