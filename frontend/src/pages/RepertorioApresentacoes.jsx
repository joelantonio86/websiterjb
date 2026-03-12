import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'
import { REPERTORIO_APRESENTACOES_2026, REPERTORIO_MAIO_2026 } from '../data/repertorioApresentacoes2026'

const RepertorioApresentacoes = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    document.title = 'Repertório das Apresentações 2026 | RJB'
    return () => { document.title = 'Racional Jazz Band' }
  }, [])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <PageWrapper title="Repertório das Apresentações 2026">
      <div className={`space-y-6 sm:space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-base sm:text-lg md:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 max-w-3xl mx-auto leading-relaxed px-2">
            Área para os músicos da RJB: confira o repertório previsto para cada apresentação de 2026. As músicas serão publicadas assim que forem definidas pelo regente.
          </p>
        </div>

        {/* Destaque: Repertório de Maio */}
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rjb-yellow/15 via-yellow-500/10 to-rjb-yellow/5 dark:from-rjb-yellow/10 dark:via-yellow-500/5 dark:to-rjb-yellow/5 border-2 border-rjb-yellow/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0" aria-hidden>📋</span>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark">
                  Repertório de Maio disponível
                </h3>
                <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
                  {REPERTORIO_MAIO_2026.length} músicas na entrada do dia 13 de maio. 
                  {REPERTORIO_MAIO_2026.filter(m => m.inProduction).length} em produção pelo regente.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                  'REPERTÓRIO RJB - MAIO 2026\n13 de maio de 2026 - Entrada\n\n' +
                  REPERTORIO_MAIO_2026.map((m, i) => `${i + 1}. ${m.title}${m.inProduction ? ' (em produção)' : ''}`).join('\n')
                )}`}
                download="Repertorio_RJB_Maio_2026.txt"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rjb-yellow text-rjb-text font-bold text-sm hover:bg-yellow-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar lista (TXT)
              </a>
              <Link
                to="/partituras?repertorio=maio"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm hover:bg-rjb-yellow/15 transition-colors"
              >
                🎼 Partituras do repertório
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {REPERTORIO_APRESENTACOES_2026.map((evento, index) => (
            <article
              key={evento.id}
              className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-l-4 sm:border-l-8 border-rjb-yellow shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4">
                  <div className="flex-shrink-0 inline-flex flex-col items-center sm:items-start p-3 sm:p-4 bg-gradient-to-br from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:to-rjb-yellow/5 rounded-xl border border-rjb-yellow/30">
                    <span className="text-2xl sm:text-3xl font-extrabold text-rjb-yellow leading-none">{evento.dateShort.split(' ')[0]}</span>
                    <span className="text-xs sm:text-sm font-bold text-rjb-text dark:text-rjb-text-dark uppercase tracking-wide">{evento.dateShort.split(' ')[1]}</span>
                    <span className="text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 mt-0.5">{evento.dateShort.split(' ')[2]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-rjb-text dark:text-rjb-text-dark mb-1">
                      {evento.title}
                    </h2>
                    <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
                      {evento.dateLabel} · {evento.location}
                    </p>
                  </div>
                </div>

                <div className="border-t border-rjb-yellow/20 pt-4">
                  {evento.songs && evento.songs.length > 0 ? (
                    <ul className="space-y-2" aria-label={`Repertório de ${evento.dateLabel}`}>
                      {evento.songs.map((musica, i) => {
                        const title = typeof musica === 'string' ? musica : musica.title
                        const inProduction = typeof musica === 'object' && musica.inProduction
                        return (
                          <li key={i} className="flex items-start gap-3 text-rjb-text dark:text-rjb-text-dark">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rjb-yellow/20 dark:bg-rjb-yellow/10 text-rjb-yellow font-semibold text-sm flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="font-medium flex items-center gap-2 flex-wrap">
                              {title}
                              {inProduction && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  Em produção
                                </span>
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-rjb-yellow/5 dark:bg-rjb-yellow/10 border border-rjb-yellow/20">
                      <span className="flex-shrink-0 text-2xl" aria-hidden="true">🎵</span>
                      <div>
                        <p className="font-semibold text-rjb-text dark:text-rjb-text-dark mb-0.5">
                          Repertório em breve
                        </p>
                        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
                          Assim que o regente definir as músicas, publicaremos aqui. Fique atento a esta página.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 max-w-2xl mx-auto">
          Para ouvir as músicas do nosso repertório, acesse a página <Link to="/player" className="text-rjb-yellow hover:underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded">Músicas</Link>.
        </p>
      </div>
    </PageWrapper>
  )
}

export default RepertorioApresentacoes
