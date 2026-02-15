import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'

// Ordem: 1 Regentes, 2 Vozes, 3 Percussão, 4 Cordas e teclas, 5 Soprado (agudo→grave), 6 Demais
// nodeBg = fundo do nó (pill); lineClr = cor das linhas de conexão (estilo organograma)
const CATEGORY_ORDER = [
  { id: 1, label: 'Regentes', keywords: ['regente', 'regência', 'maestro', 'direção', 'diretor musical', 'condutor'], nodeBg: 'bg-red-600', lineClr: 'bg-red-600', badge: 'text-red-700' },
  { id: 2, label: 'Vozes', keywords: ['voz', 'vocal', 'canto', 'cantor', 'cantora', 'cantora(o)', 'vocalista'], nodeBg: 'bg-teal-600', lineClr: 'bg-teal-600', badge: 'text-teal-700' },
  { id: 3, label: 'Percussão', keywords: ['bateria', 'percussão', 'percussion', 'tambor', 'surdo', 'pandeiro', 'congas', 'atabaque', 'percussionista', 'baterista'], nodeBg: 'bg-orange-500', lineClr: 'bg-orange-500', badge: 'text-orange-700' },
  { id: 4, label: 'Cordas e teclas', keywords: ['guitarra', 'lira', 'piano', 'cozinha', 'baixo'], nodeBg: 'bg-blue-600', lineClr: 'bg-blue-600', badge: 'text-blue-700' },
  {
    id: 5,
    label: 'Soprado (agudo ao grave)',
    keywords: ['flauta', 'flautista', 'clarinete', 'clarineta', 'sax soprano', 'saxofone soprano', 'sax alto', 'saxofone alto', 'trompete', 'trumpet', 'flugelhorn', 'sax tenor', 'saxofone tenor', 'trombone', 'sax barítono', 'sax baritono', 'saxofone barítono', 'tuba', 'eufônio', 'eufonia', 'bombardino', 'saxofone', 'sax', 'sopros', 'soprado'],
    nodeBg: 'bg-amber-500',
    lineClr: 'bg-amber-500',
    badge: 'text-amber-800',
  },
  { id: 6, label: 'Demais colaboradores', keywords: [], nodeBg: 'bg-gray-600', lineClr: 'bg-gray-500', badge: 'text-gray-700' },
]

const SOPRADO_ORDER = [
  'flauta', 'flautista', 'clarinete', 'clarineta', 'sax soprano', 'saxofone soprano',
  'sax alto', 'saxofone alto', 'trompete', 'trumpet', 'flugelhorn',
  'sax tenor', 'saxofone tenor', 'trombone',
  'sax barítono', 'sax baritono', 'saxofone barítono', 'tuba', 'eufônio', 'eufonia', 'bombardino',
  'saxofone', 'sax',
]

const SOPRADO_AGUDO_MAX = 6
const SOPRADO_MEDIO_MAX = 12

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\u0300-\u036f/g, '').trim()

function getSortKey(instrument) {
  const inst = normalize(instrument)
  if (!inst) return [6, 999, instrument]
  for (let c = 0; c < CATEGORY_ORDER.length - 1; c++) {
    const cat = CATEGORY_ORDER[c]
    for (const kw of cat.keywords) {
      if (inst.includes(normalize(kw))) {
        // "trombone baixo" é soprado (Graves), não Cordas e teclas
        if (cat.id === 4 && normalize(kw) === 'baixo' && inst.includes('trombone')) continue
        if (cat.id === 5) {
          for (let i = 0; i < SOPRADO_ORDER.length; i++) {
            if (inst.includes(normalize(SOPRADO_ORDER[i]))) return [5, i, instrument]
          }
          return [5, SOPRADO_ORDER.length, instrument]
        }
        return [cat.id, 0, instrument]
      }
    }
  }
  return [6, 0, instrument]
}

function getSopradoBand(subIndex, instrument) {
  const inst = instrument ? normalize(instrument) : ''
  if (inst && inst.includes('trombone') && inst.includes('baixo')) return 'grave'
  if (subIndex <= SOPRADO_AGUDO_MAX) return 'agudo'
  if (subIndex <= SOPRADO_MEDIO_MAX) return 'medio'
  return 'grave'
}

// Nó em pill (retângulo arredondado), texto branco, borda fina — nome, instrumento e estado na mesma ordem
function SeatCard({ item, index, nodeBg }) {
  const bg = nodeBg || 'bg-gray-600'
  return (
    <article
      className="organogram-node flex flex-col items-center justify-center touch-manipulation"
      title={`${item.displayName} — ${item.instrument} — ${item.state}`}
    >
      <div
        className={`stage-seat-card rounded-xl ${bg} flex flex-col items-center justify-center text-center min-w-[88px] max-w-[110px] px-2 py-1.5 flex-shrink-0 border border-gray-800/40 text-white`}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <p className="font-semibold text-[10px] leading-tight break-words line-clamp-2">
          {item.displayName}
        </p>
        <p className="mt-0.5 text-[9px] leading-tight break-words line-clamp-2 opacity-95">
          {item.instrument}
        </p>
        <span className="mt-0.5 text-[9px] font-medium opacity-95">
          {item.state}
        </span>
      </div>
    </article>
  )
}

// Seção: título, linha de conexão na cor do ramo + ponto, nós em pill (itens centralizados, menos distância lateral)
function StageSection({ id, title, badgeClass, items, nodeBg, lineClr, sectionIndex }) {
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
          <SeatCard key={`${id}-${i}-${item.displayName}`} item={item} index={i} nodeBg={nodeBg} />
        ))}
      </div>
    </section>
  )
}

// Seção dos soprados (3 colunas: Agudos, Médios, Graves) — pills, linhas coloridas, menos espaço
function SopradoSection({ sopradoBands, sectionIndex }) {
  const bands = [
    { key: 'agudo', label: 'Agudos', items: sopradoBands.agudo, nodeBg: 'bg-amber-500', lineClr: 'bg-amber-500' },
    { key: 'medio', label: 'Médios', items: sopradoBands.medio, nodeBg: 'bg-amber-600', lineClr: 'bg-amber-600' },
    { key: 'grave', label: 'Graves', items: sopradoBands.grave, nodeBg: 'bg-teal-500', lineClr: 'bg-teal-500' },
  ]

  return (
    <section
      className="stage-roster-section px-2 sm:px-3 py-3 sm:py-4"
      style={{ animationDelay: `${sectionIndex * 80}ms` }}
      aria-label="Soprados por registro: agudos, médios e graves"
    >
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-5xl mx-auto">
        {bands.map((band) => (
          <div key={band.key} className="flex flex-col items-center">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300">
              {band.label}
            </h3>
            {band.items.length > 0 && (
              <>
                <div className={`w-px h-2 ${band.lineClr} my-0.5`} aria-hidden />
                <div className={`w-1.5 h-1.5 rounded-full ${band.lineClr} shrink-0`} aria-hidden />
                <div className={`w-px h-2 ${band.lineClr}`} aria-hidden />
              </>
            )}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2">
              {band.items.map((item, idx) => (
                <SeatCard key={`${band.key}-${idx}-${item.displayName}`} item={item} index={idx} nodeBg={band.nodeBg} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
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
      if (!groups[label]) groups[label] = { items: [], badge: cat?.badge ?? CATEGORY_ORDER[CATEGORY_ORDER.length - 1].badge, nodeBg: cat?.nodeBg ?? CATEGORY_ORDER[CATEGORY_ORDER.length - 1].nodeBg, lineClr: cat?.lineClr ?? CATEGORY_ORDER[CATEGORY_ORDER.length - 1].lineClr }
      groups[label].items.push(item)
    })
    return groups
  }, [sortedRoster])

  const sopradoBands = useMemo(() => {
    const items = groupedByCategory['Soprado (agudo ao grave)']?.items || []
    const agudo = []; const medio = []; const grave = []
    items.forEach((item) => {
      const [, subIndex] = getSortKey(item.instrument)
      const band = getSopradoBand(subIndex, item.instrument)
      if (band === 'agudo') agudo.push(item)
      else if (band === 'medio') medio.push(item)
      else grave.push(item)
    })
    return { agudo, medio, grave }
  }, [groupedByCategory])

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light dark:bg-rjb-card-dark overflow-hidden" role="status" aria-live="polite">
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
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light dark:bg-rjb-card-dark p-8 sm:p-12 text-center">
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-sm sm:text-base">Nenhum componente cadastrado no mapa de palco.</p>
      </div>
    )
  }

  const regentes = groupedByCategory['Regentes']?.items || []
  const vozes = groupedByCategory['Vozes']?.items || []
  const percussao = groupedByCategory['Percussão']?.items || []
  const cordasTeclas = groupedByCategory['Cordas e teclas']?.items || []
  const demais = groupedByCategory['Demais colaboradores']?.items || []
  const hasSoprado = sopradoBands.agudo.length + sopradoBands.medio.length + sopradoBands.grave.length > 0

  const sections = [
    { id: 'regentes', title: 'Regentes', items: regentes, badge: CATEGORY_ORDER[0].badge, nodeBg: CATEGORY_ORDER[0].nodeBg, lineClr: CATEGORY_ORDER[0].lineClr },
    { id: 'vozes', title: 'Vozes', items: vozes, badge: CATEGORY_ORDER[1].badge, nodeBg: CATEGORY_ORDER[1].nodeBg, lineClr: CATEGORY_ORDER[1].lineClr },
    { id: 'percussao', title: 'Percussão', items: percussao, badge: CATEGORY_ORDER[2].badge, nodeBg: CATEGORY_ORDER[2].nodeBg, lineClr: CATEGORY_ORDER[2].lineClr },
    { id: 'cordas-teclas', title: 'Cordas e teclas', items: cordasTeclas, badge: CATEGORY_ORDER[3].badge, nodeBg: CATEGORY_ORDER[3].nodeBg, lineClr: CATEGORY_ORDER[3].lineClr },
  ]

  let sectionIndex = 0

  return (
    <div className="stage-plot w-full overflow-x-auto pb-6 safe-area-inset-bottom" role="region" aria-label="Mapa de palco">
      <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden bg-white dark:bg-gray-50 border border-gray-200 dark:border-gray-600/50 shadow-md">
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
              nodeBg={sec.nodeBg}
              lineClr={sec.lineClr}
              sectionIndex={idx}
            />
          )
        })}

        {hasSoprado && (
          <SopradoSection sopradoBands={sopradoBands} sectionIndex={sectionIndex++} />
        )}

        {demais.length > 0 && (
          <section
            className="stage-roster-section px-2 sm:px-3 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-500/30"
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
                <SeatCard key={`d-${i}-${item.displayName}`} item={item} index={i} nodeBg={CATEGORY_ORDER[5].nodeBg} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default StageRoster
