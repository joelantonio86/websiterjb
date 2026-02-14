import { useState, useEffect, Fragment } from 'react'
import PageWrapper from '../components/PageWrapper'
import { racionais, diversas, R2_BASE_URL } from '../data/songs'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
import AudioPlayer from '../components/AudioPlayer'

const Partituras = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [racionaisOpen, setRacionaisOpen] = useState(false)
  const [diversasOpen, setDiversasOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [focusedField, setFocusedField] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    setIsVisible(true)
    // Simular loading inicial
    setTimeout(() => setIsLoading(false), 500)
  }, [])

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

  const renderSheetCard = (sheet, idx, isRacional) => {
    const isDownloading = downloading === `pdf-${sheet.title}` || downloading === `sib-${sheet.title}`
    
    if (viewMode === 'grid') {
      return (
        <div
          className={`group p-5 rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 flex flex-col gap-4 shadow-lg hover:shadow-2xl border-l-4 ${isRacional ? 'border-rjb-yellow' : 'border-blue-500'} transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 animate-fade-in`}
          style={{ animationDelay: `${idx * 30}ms` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-lg font-bold text-rjb-text dark:text-rjb-text-dark group-hover:text-rjb-yellow transition-colors duration-300 break-words flex-1">
                {sheet.title}
              </p>
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
                download={`${sheet.title.replace(/ /g, '_')}.pdf`}
                onClick={() => handleDownload('pdf', sheet.title)}
                className={`group/btn flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-2.5 px-4 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 text-sm transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl touch-manipulation ${
                  isDownloading && downloading === `pdf-${sheet.title}` ? 'opacity-75 cursor-wait' : ''
                }`}
              >
                {downloading === `pdf-${sheet.title}` ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>PDF</span>
                  </>
                )}
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
        className={`group p-4 sm:p-5 rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 flex flex-col gap-3 sm:gap-4 shadow-md hover:shadow-xl border-l-4 ${isRacional ? 'border-rjb-yellow' : 'border-blue-500'} transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-0.5 animate-fade-in`}
        style={{ animationDelay: `${idx * 30}ms` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-base sm:text-lg md:text-xl font-bold text-rjb-text dark:text-rjb-text-dark group-hover:text-rjb-yellow transition-colors duration-300 break-words flex-1">
              {sheet.title}
            </p>
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
              download={`${sheet.title.replace(/ /g, '_')}.pdf`}
              onClick={() => handleDownload('pdf', sheet.title)}
              className={`group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 text-xs sm:text-sm transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex-1 sm:flex-none touch-manipulation ${
                downloading === `pdf-${sheet.title}` ? 'opacity-75 cursor-wait' : ''
              }`}
            >
              {downloading === `pdf-${sheet.title}` ? (
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>PDF</span>
                </>
              )}
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
              className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-2 transition-all duration-300 shadow-lg hover:shadow-xl placeholder-rjb-text/50 dark:placeholder-rjb-text-dark/50 ${
                focusedField
                  ? 'border-rjb-yellow ring-2 sm:ring-4 ring-rjb-yellow/20'
                  : 'border-rjb-yellow/30 hover:border-rjb-yellow/50'
              }`}
            />
          </div>

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
    </PageWrapper>
  )
}

export default Partituras
