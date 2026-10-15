import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { CATEGORY_ORDER, getSortKey, getSopradoNaipe } from '../utils/stageLayout'

// Cartão profissional: fundo do site + barra lateral colorida; texto no contraste do tema (claro/escuro)
function SeatCard({ item, index, accentBorder }) {
  const border = accentBorder || 'border-l-4 border-l-stone-400 dark:border-l-stone-500'
  return (
    <article
      className="organogram-node flex flex-col items-center justify-center touch-manipulation"
      title={`${item.displayName} — ${item.instrument} — ${item.state}`}
    >
      <div
        className={`stage-seat-card rounded-xl bg-rjb-card-light dark:bg-rjb-card-dark flex flex-col items-center justify-center text-center min-w-[88px] max-w-[110px] px-2 py-1.5 flex-shrink-0 border border-stone-200/80 dark:border-stone-600/80 ${border} text-rjb-text dark:text-rjb-text-dark shadow-sm hover:shadow-md transition-shadow`}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <p className="font-semibold text-[10px] leading-tight break-words line-clamp-2">
          {item.displayName}
        </p>
        <p className="mt-0.5 text-[9px] leading-tight break-words line-clamp-2 text-rjb-text/90 dark:text-rjb-text-dark/90">
          {item.instrument}
        </p>
        <span className="mt-0.5 text-[9px] font-medium text-rjb-text/80 dark:text-rjb-text-dark/80">
          {item.state}
        </span>
      </div>
    </article>
  )
}

// Seção: título, linha de conexão na cor do ramo, cartões com fundo do site e barra lateral colorida
function StageSection({ id, title, badgeClass, items, accentBorder, lineClr, sectionIndex }) {
  return (
    <section
      id={id}
      className="stage-roster-section px-2 sm:px-3 py-3 sm:py-4"
      style={{ animationDelay: `${sectionIndex * 80}ms` }}
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex flex-col items-center">
        <h3
          id={`${id}-heading`}
          className={`text-xs sm:text-sm font-semibold tracking-wide ${badgeClass}`}
        >
          {title}
        </h3>
        {items.length > 0 && (
          <>
            <div className={`w-px h-2 ${lineClr} my-0.5`} aria-hidden />
            <div className={`w-1.5 h-1.5 rounded-full ${lineClr} shrink-0`} aria-hidden />
            <div className={`w-px h-2 ${lineClr}`} aria-hidden />
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto mt-2">
        {items.map((item, i) => (
          <SeatCard key={`${id}-${i}-${item.displayName}`} item={item} index={i} accentBorder={accentBorder} />
        ))}
      </div>
    </section>
  )
}

// Seção dos soprados: Naipe de madeiras (flautas → clarinetes → sax alto → sax tenor) e Naipe de metais em duas fileiras
function SopradoSection({ sopradoNaipes, sectionIndex }) {
  const { madeiras, metaisAgudos, metaisGraves } = sopradoNaipes
  const accentBorder = CATEGORY_ORDER[4].accentBorder
  const lineClr = 'bg-rjb-yellow'
  const badge = 'text-amber-800 dark:text-amber-400'

  return (
    <>
      {madeiras.length > 0 && (
        <section
          id="soprado-madeiras"
          className="stage-roster-section px-2 sm:px-3 py-3 sm:py-4"
          style={{ animationDelay: `${sectionIndex * 80}ms` }}
          aria-labelledby="soprado-madeiras-heading"
        >
          <div className="flex flex-col items-center">
            <h3 id="soprado-madeiras-heading" className={`text-xs sm:text-sm font-semibold tracking-wide ${badge}`}>
              Naipe de madeiras
            </h3>
            <div className={`w-px h-2 ${lineClr} my-0.5`} aria-hidden />
            <div className={`w-1.5 h-1.5 rounded-full ${lineClr} shrink-0`} aria-hidden />
            <div className={`w-px h-2 ${lineClr}`} aria-hidden />
          </div>
          <p className="text-center text-[10px] sm:text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1 mb-2">Flautas, clarinetes, sax alto e sax tenor</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto mt-2">
            {madeiras.map((item, i) => (
              <SeatCard key={`madeiras-${i}-${item.displayName}`} item={item} index={i} accentBorder={accentBorder} />
            ))}
          </div>
        </section>
      )}

      {(metaisAgudos.length > 0 || metaisGraves.length > 0) && (
        <section
          id="soprado-metais"
          className="stage-roster-section px-2 sm:px-3 py-3 sm:py-4 border-t border-stone-200 dark:border-stone-600/60"
          style={{ animationDelay: `${(sectionIndex + 1) * 80}ms` }}
          aria-label="Naipe de metais"
        >
          <div className="flex flex-col items-center mb-3">
            <h3 id="soprado-metais-heading" className={`text-xs sm:text-sm font-semibold tracking-wide ${badge}`}>
              Naipe de metais
            </h3>
            <div className={`w-px h-2 ${lineClr} my-0.5`} aria-hidden />
            <div className={`w-1.5 h-1.5 rounded-full ${lineClr} shrink-0`} aria-hidden />
            <div className={`w-px h-2 ${lineClr}`} aria-hidden />
          </div>

          {metaisAgudos.length > 0 && (
            <div className="mb-4">
              <p className="text-center text-[10px] sm:text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 mb-2">Trompetes e trompas</p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto">
                {metaisAgudos.map((item, i) => (
                  <SeatCard key={`metais-agudos-${i}-${item.displayName}`} item={item} index={i} accentBorder={accentBorder} />
                ))}
              </div>
            </div>
          )}

          {metaisGraves.length > 0 && (
            <div>
              <p className="text-center text-[10px] sm:text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 mb-2">Trombones, trombones baixos, bombardinos e tubas</p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto">
                {metaisGraves.map((item, i) => (
                  <SeatCard key={`metais-graves-${i}-${item.displayName}`} item={item} index={i} accentBorder={accentBorder} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  )
}

const StageRoster = () => {
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchRoster = async () => {
      setError(null)
      try {
        const res = await api.get('/api/public/stats/stage-roster')
        if (!cancelled) setRoster(res.data.roster || [])
      } catch (err) {
        if (!cancelled) {
          setRoster([])
          setError(err.response?.data?.message || err.message || 'Não foi possível carregar o mapa de palco.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRoster()
    return () => { cancelled = true }
  }, [])

  const sortedRoster = useMemo(() => {
    return [...roster].sort((a, b) => {
      const [catA, subA] = getSortKey(a.instrument)
      const [catB, subB] = getSortKey(b.instrument)
      if (catA !== catB) return catA - catB
      if (catA === 5 && subA !== subB) return subA - subB
      return (a.displayName || '').localeCompare(b.displayName || '', 'pt-BR')
    })
  }, [roster])

  const groupedByCategory = useMemo(() => {
    const groups = {}
    sortedRoster.forEach((item) => {
      const [catId] = getSortKey(item.instrument)
      const cat = CATEGORY_ORDER.find((c) => c.id === catId)
      const label = cat?.label || 'Demais colaboradores'
      if (!groups[label]) groups[label] = { items: [], badge: cat?.badge ?? CATEGORY_ORDER[CATEGORY_ORDER.length - 1].badge, accentBorder: cat?.accentBorder ?? CATEGORY_ORDER[CATEGORY_ORDER.length - 1].accentBorder, lineClr: cat?.lineClr ?? CATEGORY_ORDER[CATEGORY_ORDER.length - 1].lineClr }
      groups[label].items.push(item)
    })
    return groups
  }, [sortedRoster])

  const sopradoNaipes = useMemo(() => {
    const items = groupedByCategory['Soprado (madeiras e metais)']?.items || []
    const madeiras = []; const metaisAgudos = []; const metaisGraves = []
    items.forEach((item) => {
      const { band, subIndex } = getSopradoNaipe(item.instrument)
      const entry = { ...item, _subIndex: subIndex }
      if (band === 'madeiras') madeiras.push(entry)
      else if (band === 'metais_agudos') metaisAgudos.push(entry)
      else metaisGraves.push(entry)
    })
    madeiras.sort((a, b) => a._subIndex - b._subIndex)
    metaisAgudos.sort((a, b) => a._subIndex - b._subIndex)
    metaisGraves.sort((a, b) => a._subIndex - b._subIndex)
    return { madeiras, metaisAgudos, metaisGraves }
  }, [groupedByCategory])

  if (loading) {
    return (
      <div className="rounded-2xl border border-rjb-border-light dark:border-rjb-border-dark bg-rjb-card-light dark:bg-rjb-card-dark overflow-hidden" role="status" aria-live="polite">
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-rjb-yellow/40 border-t-rjb-yellow rounded-full animate-spin" aria-hidden />
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70">Carregando mapa de palco...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-6 sm:p-8 text-center" role="alert">
        <p className="text-amber-800 dark:text-amber-200 text-sm sm:text-base">{error}</p>
      </div>
    )
  }

  if (roster.length === 0) {
    return (
      <div className="rounded-2xl border border-rjb-border-light dark:border-rjb-border-dark bg-rjb-card-light dark:bg-rjb-card-dark p-8 sm:p-12 text-center">
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-sm sm:text-base">Nenhum componente cadastrado no mapa de palco.</p>
      </div>
    )
  }

  const regentes = groupedByCategory['Regentes']?.items || []
  const vozes = groupedByCategory['Vozes']?.items || []
  const percussao = groupedByCategory['Percussão']?.items || []
  const cordasTeclas = groupedByCategory['Cordas e teclas']?.items || []
  const demais = groupedByCategory['Demais colaboradores']?.items || []
  const hasSoprado = sopradoNaipes.madeiras.length + sopradoNaipes.metaisAgudos.length + sopradoNaipes.metaisGraves.length > 0

  const sections = [
    { id: 'regentes', title: 'Regentes', items: regentes, badge: CATEGORY_ORDER[0].badge, accentBorder: CATEGORY_ORDER[0].accentBorder, lineClr: CATEGORY_ORDER[0].lineClr },
    { id: 'vozes', title: 'Vozes', items: vozes, badge: CATEGORY_ORDER[1].badge, accentBorder: CATEGORY_ORDER[1].accentBorder, lineClr: CATEGORY_ORDER[1].lineClr },
    { id: 'percussao', title: 'Percussão', items: percussao, badge: CATEGORY_ORDER[2].badge, accentBorder: CATEGORY_ORDER[2].accentBorder, lineClr: CATEGORY_ORDER[2].lineClr },
    { id: 'cordas-teclas', title: 'Cordas e teclas', items: cordasTeclas, badge: CATEGORY_ORDER[3].badge, accentBorder: CATEGORY_ORDER[3].accentBorder, lineClr: CATEGORY_ORDER[3].lineClr },
  ]

  let sectionIndex = 0

  return (
    <div className="stage-plot w-full overflow-x-auto pb-6 safe-area-inset-bottom" role="region" aria-label="Mapa de palco">
      <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden bg-rjb-card-light dark:bg-rjb-card-dark border border-rjb-border-light dark:border-rjb-border-dark shadow-md">
        {sections.map((sec) => {
          if (sec.items.length === 0) return null
          const idx = sectionIndex++
          return (
            <StageSection
              key={sec.id}
              id={sec.id}
              title={sec.title}
              badgeClass={sec.badge}
              items={sec.items}
              accentBorder={sec.accentBorder}
              lineClr={sec.lineClr}
              sectionIndex={idx}
            />
          )
        })}

        {hasSoprado && (
          <SopradoSection sopradoNaipes={sopradoNaipes} sectionIndex={sectionIndex++} />
        )}

        {demais.length > 0 && (
          <section
            className="stage-roster-section px-2 sm:px-3 py-3 sm:py-4 border-t border-rjb-border-light dark:border-rjb-border-dark"
            style={{ animationDelay: `${sectionIndex * 80}ms` }}
            aria-labelledby="demais-heading"
          >
            <div className="flex flex-col items-center">
              <h3 id="demais-heading" className={`text-xs sm:text-sm font-semibold tracking-wide ${CATEGORY_ORDER[5].badge}`}>
                Demais colaboradores
              </h3>
              <div className={`w-px h-2 ${CATEGORY_ORDER[5].lineClr} my-0.5`} aria-hidden />
              <div className={`w-1.5 h-1.5 rounded-full ${CATEGORY_ORDER[5].lineClr} shrink-0`} aria-hidden />
              <div className={`w-px h-2 ${CATEGORY_ORDER[5].lineClr}`} aria-hidden />
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto mt-2">
              {demais.map((item, i) => (
                <SeatCard key={`d-${i}-${item.displayName}`} item={item} index={i} accentBorder={CATEGORY_ORDER[5].accentBorder} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default StageRoster
