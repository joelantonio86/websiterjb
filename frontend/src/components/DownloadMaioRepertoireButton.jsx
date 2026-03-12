import { useState } from 'react'
import { downloadMaioRepertoirePdfs } from '../utils/downloadMaioRepertoire'
import { showToast } from './Toast'

export default function DownloadMaioRepertoireButton({ className = '', variant = 'default' }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    setProgress(0)
    try {
      const { totalOk, failed } = await downloadMaioRepertoirePdfs({
        onProgress: (p) => setProgress(p),
      })
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
      setProgress(0)
    }
  }

  const baseClass = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed'
  const variantClass =
    variant === 'primary'
      ? 'bg-rjb-yellow text-rjb-text hover:bg-yellow-500'
      : 'border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/15'

  return (
    <div className="inline-flex flex-col gap-1 min-w-[180px]">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${baseClass} ${variantClass} ${className}`}
        title="Baixa em ZIP as partituras em PDF do repertório de maio"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Gerando ZIP... {progress}%
          </>
        ) : (
          <>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar partituras (ZIP)
          </>
        )}
      </button>
      {loading && (
        <div className="h-1 bg-rjb-bg-light dark:bg-rjb-bg-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-rjb-yellow rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
