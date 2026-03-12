import { useState } from 'react'
import { downloadMaioRepertoirePdfs } from '../utils/downloadMaioRepertoire'
import { showToast } from './Toast'

export default function DownloadMaioRepertoireButton({ className = '', variant = 'default' }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { totalOk, failed } = await downloadMaioRepertoirePdfs()
      if (totalOk === 0) {
        showToast('Nenhuma partitura disponível para download.', 'warning', 4000)
      } else if (failed.length === 0) {
        showToast(`${totalOk} partituras baixadas com sucesso!`, 'success', 4000)
      } else {
        showToast(
          `${totalOk} baixadas. ${failed.length} não disponíveis: ${failed.slice(0, 2).join(', ')}${failed.length > 2 ? '...' : ''}`,
          'warning',
          5000
        )
      }
    } catch (e) {
      showToast('Erro ao gerar o ZIP. Tente novamente.', 'error', 4000)
    } finally {
      setLoading(false)
    }
  }

  const baseClass = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed'
  const variantClass =
    variant === 'primary'
      ? 'bg-rjb-yellow text-rjb-text hover:bg-yellow-500'
      : 'border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/15'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${baseClass} ${variantClass} ${className}`}
      title="Baixa em ZIP as partituras em PDF do repertório de maio"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Gerando ZIP...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Baixar partituras (ZIP)
        </>
      )}
    </button>
  )
}
