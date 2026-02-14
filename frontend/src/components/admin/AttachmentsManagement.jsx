import { useState, useEffect } from 'react'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import api from '../../services/api'

const AttachmentsManagement = () => {
  const [attachments, setAttachments] = useState([])
  const [file, setFile] = useState(null)

  useEffect(() => {
    fetchAttachments()
  }, [])

  const fetchAttachments = async () => {
    try {
      const response = await api.get('/api/attachments/list')
      setAttachments(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar anexos:', error)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      showMessage('Selecione um arquivo para upload.', true)
      return
    }

    showLoader(true, 'Enviando arquivo...')
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/api/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showMessage('Arquivo enviado com sucesso!')
      setFile(null)
      e.target.reset()
      fetchAttachments()
    } catch (error) {
      showMessage('Erro ao enviar arquivo.', true)
    } finally {
      showLoader(false)
    }
  }

  const handleDelete = async (fileName) => {
    if (!confirm(`Deseja realmente excluir o arquivo "${fileName}"?`)) return

    try {
      await api.delete(`/api/attachments/delete/${fileName}`)
      showMessage('Arquivo excluído com sucesso!')
      fetchAttachments()
    } catch (error) {
      showMessage('Erro ao excluir arquivo.', true)
    }
  }

  return (
    <div className="bg-gradient-to-br from-rjb-card-light to-rjb-bg-light dark:from-rjb-card-dark dark:to-rjb-bg-dark/50 rounded-2xl shadow-xl border-2 border-rjb-yellow/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className="bg-gradient-to-r from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:via-rjb-yellow/5 dark:to-rjb-yellow/5 px-5 sm:px-6 py-4 border-b border-rjb-yellow/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rjb-yellow/30 to-rjb-yellow/20 dark:from-rjb-yellow/20 dark:to-rjb-yellow/10 shadow-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-rjb-text dark:text-rjb-text-dark">Gerenciamento de Anexos</h3>
            <p className="text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mt-0.5">Faça upload e gerencie arquivos do sistema</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <form onSubmit={handleUpload} className="p-4 sm:p-5 border-2 border-dashed border-rjb-yellow/50 rounded-xl bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/30 hover:border-rjb-yellow transition-colors">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              id="attachment-file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full sm:flex-1 p-3 text-sm border-2 border-rjb-yellow/30 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark focus:border-rjb-yellow focus:ring-2 focus:ring-rjb-yellow/20 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rjb-yellow file:text-rjb-text hover:file:bg-yellow-500"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-3 px-6 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Upload
            </button>
          </div>
        </form>

        <div className="space-y-2 sm:space-y-3">
          {attachments.length === 0 ? (
            <p className="text-center opacity-50 text-sm">Nenhum arquivo encontrado.</p>
          ) : (
            attachments.map((attachment) => (
              <div
                key={attachment.name}
                className="flex items-center justify-between p-3 bg-rjb-bg-light dark:bg-rjb-bg-dark rounded-lg border border-rjb-yellow/10 mb-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[180px]">{attachment.name}</span>
                  <span className="text-[10px] opacity-50">
                    {new Date(attachment.uploaded).toLocaleString()}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <a
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rjb-yellow hover:underline text-xs font-bold"
                  >
                    BAIXAR
                  </a>
                  <button
                    onClick={() => handleDelete(attachment.name)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AttachmentsManagement
