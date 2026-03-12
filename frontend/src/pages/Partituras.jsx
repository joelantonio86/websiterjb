import { useState, useEffect, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import JSZip from 'jszip'
import PageWrapper from '../components/PageWrapper'
import { racionais, diversas, R2_BASE_URL } from '../data/songs'
import { REPERTORIO_MAIO_SHEET_IDS } from '../data/repertorioApresentacoes2026'
import { API_BASE } from '../services/api'
import { showToast } from '../components/Toast'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import AudioPlayer from '../components/AudioPlayer'

function DownloadFailedModal({ totalOk, failed, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  const copyList = () => {
    navigator.clipboard.writeText(failed.join(', '))
    showToast('Lista copiada para a área de transferência', 'success', 2500)
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-rjb-card-light to-rjb-card-light/95 dark:from-rjb-card-dark dark:to-rjb-card-dark/95 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500/20 mb-4">
            <svg className="w-7 h-7 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-rjb-text dark:text-rjb-text-dark mb-2">Download parcial</h3>
          <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 mb-4">
            <strong>{totalOk}</strong> partitura{totalOk !== 1 ? 's' : ''} baixada{totalOk !== 1 ? 's' : ''} com sucesso. 
            {failed.length} {failed.length === 1 ? 'não estava disponível' : 'não estavam disponíveis'}:
          </p>
          <div className="bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/50 rounded-xl p-4 max-h-48 overflow-y-auto border border-yellow-500/20">
            <ul className="space-y-2 text-sm text-rjb-text dark:text-rjb-text-dark">
              {failed.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={copyList}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-yellow-500/50 text-rjb-text dark:text-rjb-text-dark hover:bg-yellow-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar lista
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text hover:from-yellow-500 hover:to-yellow-600 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Partituras = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [racionaisOpen, setRacionaisOpen] = useState(false)
  const [diversasOpen, setDiversasOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [focusedField, setFocusedField] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [selectedSheets, setSelectedSheets] = useState(new Set())
  const [batchDownloading, setBatchDownloading] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0) // 0-100 durante o download
  const [downloadFailedModal, setDownloadFailedModal] = useState(null) // { totalOk, failed }

  useEffect(() => {
    setIsVisible(true)
    // Simular loading inicial
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  useEffect(() => {
    if (searchParams.get('repertorio') === 'maio') {
      const ids = new Set(REPERTORIO_MAIO_SHEET_IDS.filter(id => {
        const dashIdx = id.indexOf('-')
        const folder = id.slice(0, dashIdx)
        const mp3 = id.slice(dashIdx + 1)
        return (folder === 'racionais' ? racionais : diversas).some(s => s.mp3 === mp3)
      }))
      setSelectedSheets(ids)
      setRacionaisOpen(true)
      setDiversasOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    // Resetar estado de download após 2 segundos
    if (downloading) {
      const timer = setTimeout(() => setDownloading(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [downloading])

  const allSheets = [
    ...racionais.map(s => ({ ...s, category: 'Músicas Racionais', folder: 'racionais', categoryId: 'racionais' })),
    ...diversas.map(s => ({ ...s, category: 'Outros Clássicos', folder: 'diversas', categoryId: 'diversas' })),
  ].sort((a, b) => a.title.localeCompare(b.title))

  // Filtro de busca
  const filteredSheets = allSheets.filter(sheet => {
    const normalizedSearch = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const normalizedTitle = sheet.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedTitle.includes(normalizedSearch)
  })

  const sheetsByCategory = filteredSheets.reduce((acc, sheet) => {
    (acc[sheet.category] = acc[sheet.category] || []).push(sheet)
    return acc
  }, {})

  const totalSheets = filteredSheets.length
  const racionaisCount = filteredSheets.filter(s => s.categoryId === 'racionais').length
  const diversasCount = filteredSheets.filter(s => s.categoryId === 'diversas').length

  const handleDownload = (type, title) => {
    setDownloading(`${type}-${title}`)
  }

  const getSheetId = (sheet) => `${sheet.folder}-${sheet.mp3}`

  const toggleSheetSelection = (sheet) => {
    const id = getSheetId(sheet)
    setSelectedSheets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedSheets(new Set(filteredSheets.map(getSheetId)))
  }

  const selectMayRepertoire = () => {
    const ids = new Set(REPERTORIO_MAIO_SHEET_IDS.filter(id => {
      const dashIdx = id.indexOf('-')
      const folder = id.slice(0, dashIdx)
      const mp3 = id.slice(dashIdx + 1)
      return (folder === 'racionais' ? racionais : diversas).some(s => s.mp3 === mp3)
    }))
    setSelectedSheets(ids)
    setRacionaisOpen(true)
    setDiversasOpen(true)
    showToast(`${ids.size} partituras do repertório de maio selecionadas`, 'success', 3000)
  }

  const clearSelection = () => setSelectedSheets(new Set())

  const downloadSelectedAsZip = async () => {
    const toDownload = filteredSheets.filter(s => selectedSheets.has(getSheetId(s)))
    if (toDownload.length === 0) return
    setBatchDownloading(true)
    setBatchProgress(0)
    const failed = []
    const total = toDownload.length
    try {
      const zip = new JSZip()
      const racionaisFiles = []
      const diversasFiles = []
      const proxyUrl = (folder, file) => `${API_BASE}/api/public/partituras/proxy?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(file)}`
      for (let i = 0; i < toDownload.length; i++) {
        const sheet = toDownload[i]
        const url = proxyUrl(sheet.folder, sheet.mp3)
        try {
          const res = await fetch(url)
          if (res.ok) {
            const blob = await res.blob()
            const fileName = `${sheet.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`
            const entry = { fileName, blob }
            if (sheet.folder === 'racionais') racionaisFiles.push(entry)
            else diversasFiles.push(entry)
          } else {
            failed.push(sheet.title)
          }
        } catch (e) {
          console.warn(`Falha ao baixar ${sheet.title}:`, e)
          failed.push(sheet.title)
        }
        setBatchProgress(Math.round(((i + 1) / total) * 85))
      }
      if (racionaisFiles.length > 0) {
        const racionaisFolder = zip.folder('Racionais')
        racionaisFiles.forEach(({ fileName, blob }) => racionaisFolder.file(fileName, blob))
      }
      if (diversasFiles.length > 0) {
        const diversasFolder = zip.folder('Outros_Classicos')
        diversasFiles.forEach(({ fileName, blob }) => diversasFolder.file(fileName, blob))
      }
      const totalOk = racionaisFiles.length + diversasFiles.length
      if (totalOk === 0) {
        setBatchProgress(0)
        alert('Nenhum PDF pôde ser baixado. Verifique sua conexão e tente novamente.')
        return
      }
      setBatchProgress(90)
      const content = await zip.generateAsync({ type: 'blob' })
      setBatchProgress(100)
      await new Promise(r => setTimeout(r, 400))
      const a = document.createElement('a')
      a.href = URL.createObjectURL(content)
      a.download = `Partituras_RJB_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
      setSelectedSheets(new Set())
      if (failed.length === 0) {
        showToast(`${totalOk} partitura${totalOk !== 1 ? 's' : ''} baixada${totalOk !== 1 ? 's' : ''} com sucesso!`, 'success', 4000)
      } else {
        console.warn(`[Partituras] ${failed.length} arquivo(s) não baixados:`, failed)
        setDownloadFailedModal({ totalOk, failed })
      }
    } catch (e) {
      console.error('Erro ao gerar ZIP:', e)
      alert('Erro ao gerar o arquivo ZIP. Tente novamente.')
    } finally {
      setBatchProgress(0)
      setBatchDownloading(false)
    }
  }

  const renderSheetCard = (sheet, idx, isRacional) => {
    const isDownloading = downloading === `pdf-${sheet.title}` || downloading === `sib-${sheet.title}`
    const isSelected = selectedSheets.has(getSheetId(sheet))
    
    if (viewMode === 'grid') {
      return (
        <div
          className={`group p-5 rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 flex flex-col gap-4 shadow-lg hover:shadow-2xl border-l-4 ${isRacional ? 'border-rjb-yellow' : 'border-blue-500'} transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 animate-fade-in ${isSelected ? 'ring-2 ring-rjb-yellow' : ''}`}
          style={{ animationDelay: `${idx * 30}ms` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSheetSelection(sheet)}
                  className="w-4 h-4 rounded border-rjb-yellow text-rjb-yellow focus:ring-rjb-yellow"
                  aria-label={`Selecionar ${sheet.title} para download em lote`}
                />
              <p className="text-lg font-bold text-rjb-text dark:text-rjb-text-dark group-hover:text-rjb-yellow transition-colors duration-300 break-words">
                {sheet.title}
              </p>
              </label>
              {isRacional && (
                <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold bg-rjb-yellow/20 text-rjb-yellow rounded-full">
                  Racional
                </span>
              )}
            </div>
            {sheet.time && (
              <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 flex items-center gap-2 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{sheet.time}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <AudioPlayer 
              src={`${R2_BASE_URL}/${sheet.folder}/mp3/${sheet.mp3}.mp3`} 
              title={sheet.title}
            />

            <div className="flex gap-2">
              <a
                href={`${R2_BASE_URL}/${sheet.folder}/pdf/${sheet.mp3}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-2.5 px-4 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 text-sm transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl touch-manipulation"
              >
                <svg className="w-4 h-4 group-hover/btn:translate-y-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                <span>PDF</span>
              </a>

              <a
                href={`${R2_BASE_URL}/${sheet.folder}/sib/${sheet.mp3}.sib`}
                download={`${sheet.title.replace(/ /g, '_')}.sib`}
                onClick={() => handleDownload('sib', sheet.title)}
                className={`group/btn flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700 text-white font-bold py-2.5 px-4 rounded-lg hover:from-gray-800 hover:to-gray-900 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 text-sm transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl touch-manipulation ${
                  isDownloading && downloading === `sib-${sheet.title}` ? 'opacity-75 cursor-wait' : ''
                }`}
              >
                {downloading === `sib-${sheet.title}` ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Baixando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 group-hover/btn:translate-y-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>SIB</span>
                  </>
                )}
              </a>
            </div>
          </div>
        </div>
      )
    }

    // List view (original melhorado)
    return (
      <div
        className={`group p-4 sm:p-5 rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 flex flex-col gap-3 sm:gap-4 shadow-md hover:shadow-xl border-l-4 ${isRacional ? 'border-rjb-yellow' : 'border-blue-500'} transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-0.5 animate-fade-in ${isSelected ? 'ring-2 ring-rjb-yellow' : ''}`}
        style={{ animationDelay: `${idx * 30}ms` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSheetSelection(sheet)}
                className="w-4 h-4 rounded border-rjb-yellow text-rjb-yellow focus:ring-rjb-yellow"
                aria-label={`Selecionar ${sheet.title} para download em lote`}
              />
            <p className="text-base sm:text-lg md:text-xl font-bold text-rjb-text dark:text-rjb-text-dark group-hover:text-rjb-yellow transition-colors duration-300 break-words">
              {sheet.title}
            </p>
            </label>
            {isRacional && (
              <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold bg-rjb-yellow/20 text-rjb-yellow rounded-full">
                Racional
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 flex items-center gap-2">
            {sheet.time && (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{sheet.time}</span>
                <span>•</span>
              </>
            )}
            <span>Referência / Arquivos</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-start sm:justify-end gap-2 sm:gap-3 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-auto">
            <AudioPlayer 
              src={`${R2_BASE_URL}/${sheet.folder}/mp3/${sheet.mp3}.mp3`} 
              title={sheet.title}
              className="w-full sm:w-64 md:w-72" 
            />
          </div>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <a
              href={`${R2_BASE_URL}/${sheet.folder}/pdf/${sheet.mp3}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 text-xs sm:text-sm transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex-1 sm:flex-none touch-manipulation"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-y-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              <span>PDF</span>
            </a>

            <a
              href={`${R2_BASE_URL}/${sheet.folder}/sib/${sheet.mp3}.sib`}
              download={`${sheet.title.replace(/ /g, '_')}.sib`}
              onClick={() => handleDownload('sib', sheet.title)}
              className={`group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700 text-white font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:from-gray-800 hover:to-gray-900 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 text-xs sm:text-sm transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex-1 sm:flex-none touch-manipulation ${
                downloading === `sib-${sheet.title}` ? 'opacity-75 cursor-wait' : ''
              }`}
            >
              {downloading === `sib-${sheet.title}` ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Baixando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-y-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  <span>SIB</span>
                </>
              )}
            </a>
          </div>
        </div>
      </div>
    )
  }

  const renderCategorySection = (categoryTitle, sheets, categoryId) => {
    if (!sheets || sheets.length === 0) return null

    const isRacional = categoryId === 'racionais'
    const isOpen = isRacional ? racionaisOpen : diversasOpen

    return (
      <div className="mb-6 sm:mb-8 animate-fade-in" key={categoryTitle}>
        {/* Cabeçalho da Categoria - Design Profissional */}
        <div 
          className={`relative overflow-hidden rounded-2xl shadow-xl border-2 transition-all duration-500 ${
            isRacional 
              ? 'bg-gradient-to-br from-rjb-yellow/20 via-yellow-500/10 to-rjb-yellow/5 dark:from-rjb-yellow/10 dark:via-yellow-500/5 dark:to-rjb-yellow/5 border-rjb-yellow/40 hover:border-rjb-yellow/60' 
              : 'bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-blue-500/5 dark:from-blue-500/10 dark:via-blue-600/5 dark:to-blue-500/5 border-blue-500/40 hover:border-blue-500/60'
          }`}
        >
          {/* Decoração de fundo */}
          <div className={`absolute inset-0 opacity-10 ${
            isRacional ? 'bg-rjb-yellow' : 'bg-blue-500'
          }`} style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${isRacional ? 'rgba(255, 215, 0, 0.3)' : 'rgba(59, 130, 246, 0.3)'} 0%, transparent 50%)`,
          }}></div>

          <button
            onClick={() => isRacional ? setRacionaisOpen(!racionaisOpen) : setDiversasOpen(!diversasOpen)}
            className="relative w-full p-5 sm:p-6 md:p-8 group"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Lado Esquerdo - Ícone e Título */}
              <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                {/* Ícone da Categoria */}
                <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                  isRacional 
                    ? 'bg-gradient-to-br from-rjb-yellow to-yellow-500' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}>
                  {isRacional ? '🎷' : '🎼'}
                </div>

                {/* Título e Informações */}
                <div className="flex-1 min-w-0">
                  <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isRacional ? 'text-rjb-yellow' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {categoryTitle}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      isRacional 
                        ? 'bg-rjb-yellow/30 text-rjb-yellow' 
                        : 'bg-blue-500/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      {sheets.length} {sheets.length === 1 ? 'música' : 'músicas'}
                    </span>
                    <span className="text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60">
                      Clique para {isOpen ? 'recolher' : 'expandir'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado Direito - Ícone de Expansão */}
              <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isRacional 
                  ? 'bg-rjb-yellow/20 group-hover:bg-rjb-yellow/30' 
                  : 'bg-blue-500/20 group-hover:bg-blue-500/30'
              }`}>
                <svg
                  className={`w-6 h-6 sm:w-7 sm:h-7 transform transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : 'rotate-0'
                  } ${isRacional ? 'text-rjb-yellow' : 'text-blue-600 dark:text-blue-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Conteúdo da Categoria */}
        <div className={`accordion-content mt-4 sm:mt-6 ${isOpen ? 'open' : ''}`}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sheets.map((sheet, idx) => (
                <Fragment key={`${sheet.folder}-${sheet.mp3}`}>
                  {renderSheetCard(sheet, idx, isRacional)}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sheets.map((sheet, idx) => (
                <Fragment key={`${sheet.folder}-${sheet.mp3}`}>
                  {renderSheetCard(sheet, idx, isRacional)}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="space-y-6">
          <SkeletonLoader count={3} />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className={`space-y-4 sm:space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        {/* Header com estatísticas */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rjb-text dark:text-rjb-text-dark mb-3">
            🎼 Partituras
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 max-w-3xl mx-auto leading-relaxed px-2 mb-4">
            Área exclusiva para músicos. Faça o download de partituras e referências de áudio para ensaio.
          </p>
          
          {/* Estatísticas */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6">
            <div className="px-4 py-2 bg-gradient-to-r from-rjb-yellow/20 to-yellow-500/10 dark:from-rjb-yellow/10 dark:to-yellow-500/5 rounded-lg border border-rjb-yellow/30">
              <div className="text-2xl sm:text-3xl font-bold text-rjb-yellow">{totalSheets}</div>
              <div className="text-xs sm:text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">Total</div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-rjb-yellow/20 to-yellow-500/10 dark:from-rjb-yellow/10 dark:to-yellow-500/5 rounded-lg border border-rjb-yellow/30">
              <div className="text-2xl sm:text-3xl font-bold text-rjb-yellow">{racionaisCount}</div>
              <div className="text-xs sm:text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">Racionais</div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/10 dark:from-blue-500/10 dark:to-blue-600/5 rounded-lg border border-blue-500/30">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{diversasCount}</div>
              <div className="text-xs sm:text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">Outros</div>
            </div>
          </div>
        </div>

        {/* Barra de controles */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10" data-tour="search">
          {/* Busca */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setFocusedField(true)}
              onBlur={() => setFocusedField(false)}
              placeholder="Digite o nome da música para buscar..."
              className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-base rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-2 transition-all duration-300 shadow-lg hover:shadow-xl placeholder-rjb-text/50 dark:placeholder-rjb-text-dark/50 ${
                focusedField
                  ? 'border-rjb-yellow ring-2 sm:ring-4 ring-rjb-yellow/20'
                  : 'border-rjb-yellow/30 hover:border-rjb-yellow/50'
              }`}
            />
          </div>

          {/* Download em lote */}
          {filteredSheets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-rjb-yellow/50 text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 transition-colors"
              >
                Selecionar todas
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-rjb-text/20 text-rjb-text/70 dark:text-rjb-text-dark/70 hover:bg-rjb-text/5 transition-colors"
              >
                Desmarcar
              </button>
              <button
                type="button"
                onClick={selectMayRepertoire}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-rjb-yellow/50 bg-rjb-yellow/10 text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/20 transition-colors"
                title="Seleciona as partituras do repertório de maio (13/05/2026)"
              >
                📋 Repertório de Maio
              </button>
              <button
                type="button"
                onClick={downloadSelectedAsZip}
                disabled={selectedSheets.size === 0 || batchDownloading}
                className="px-3 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {batchDownloading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Gerando ZIP...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar selecionadas ({selectedSheets.size})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Toggle de visualização */}
          <div className="flex rounded-xl overflow-hidden border-2 border-rjb-yellow/30 shadow-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 sm:px-4 py-3 sm:py-4 transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-rjb-yellow text-rjb-text'
                  : 'bg-rjb-card-light dark:bg-rjb-card-dark text-rjb-text/60 dark:text-rjb-text-dark/60 hover:text-rjb-yellow'
              }`}
              aria-label="Visualização em lista"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 sm:px-4 py-3 sm:py-4 transition-all duration-300 border-l-2 border-rjb-yellow/30 ${
                viewMode === 'grid'
                  ? 'bg-rjb-yellow text-rjb-text'
                  : 'bg-rjb-card-light dark:bg-rjb-card-dark text-rjb-text/60 dark:text-rjb-text-dark/60 hover:text-rjb-yellow'
              }`}
              aria-label="Visualização em grade"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Lista de partituras com novo design */}
        {Object.entries(sheetsByCategory).map(([category, sheets]) => {
          const categoryId = sheets[0]?.categoryId || (category.includes('Racional') ? 'racionais' : 'diversas')
          return renderCategorySection(category, sheets, categoryId)
        })}

        {/* Empty State */}
        {filteredSheets.length === 0 && (
          <EmptyState
            icon="🎵"
            title={searchTerm ? "Nenhuma música encontrada" : "Nenhuma partitura disponível"}
            description={searchTerm ? `Não encontramos resultados para "${searchTerm}". Tente buscar com outros termos.` : "Não há partituras disponíveis no momento."}
          />
        )}
      </div>

      {/* Overlay de progresso durante o download em lote */}
      {batchDownloading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-rjb-card-light to-rjb-card-light/95 dark:from-rjb-card-dark dark:to-rjb-card-dark/95 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rjb-yellow/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-rjb-yellow animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-rjb-text dark:text-rjb-text-dark">Gerando ZIP</h3>
                <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-0.5">
                  Baixando partituras... {batchProgress}%
                </p>
              </div>
            </div>
            <div className="h-2.5 bg-rjb-bg-light dark:bg-rjb-bg-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rjb-yellow to-yellow-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${batchProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de partituras não disponíveis */}
      {downloadFailedModal && (
        <DownloadFailedModal
          totalOk={downloadFailedModal.totalOk}
          failed={downloadFailedModal.failed}
          onClose={() => setDownloadFailedModal(null)}
        />
      )}
    </PageWrapper>
  )
}

export default Partituras
