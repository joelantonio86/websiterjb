import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import api from '../services/api'

const GEO_URL = 'https://raw.githubusercontent.com/giuliano-macedo/geodata-br-states/main/geojson/br_states.json'

const UF_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

const UFS = Object.keys(UF_NAMES)

const emptyByState = () => {
  const o = {}
  UFS.forEach(uf => { o[uf] = 0 })
  return o
}

// Paleta suave: cinza (vazio) → verde-água → teal → âmbar (mais componentes)
const getFillColor = (count, maxCount) => {
  if (count === 0) return '#e5e7eb' // cinza claro (estado sem componentes)
  if (maxCount === 0) return '#e5e7eb'
  const t = Math.min(1, count / maxCount)
  // Gradiente: #a7f3d0 (verde claro) → #2dd4bf (teal) → #f59e0b (âmbar)
  if (t < 0.5) {
    const s = t * 2 // 0..1
    const r = Math.round(167 + (45 - 167) * s)
    const g = Math.round(243 + (212 - 243) * s)
    const b = Math.round(208 + (191 - 208) * s)
    return `rgb(${r}, ${g}, ${b})`
  }
  const s = (t - 0.5) * 2
  const r = Math.round(45 + (245 - 45) * s)
  const g = Math.round(212 + (158 - 212) * s)
  const b = Math.round(191 + (11 - 191) * s)
  return `rgb(${r}, ${g}, ${b})`
}

const MAP_CENTER = [-54, -15]

const BrazilMap = () => {
  const [byState, setByState] = useState({})
  const [byStateDetail, setByStateDetail] = useState({})
  const [total, setTotal] = useState(0)
  const [geo, setGeo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statsError, setStatsError] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [mapCenter, setMapCenter] = useState(MAP_CENTER)
  const [mapZoom, setMapZoom] = useState(1)
  const tooltipHideTimeout = useRef(null)
  const tooltipOpenedAt = useRef(0)
  const TOOLTIP_HIDE_DELAY_MS = 150
  const BACKDROP_IGNORE_MS = 400

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setStatsError(null)
      try {
        const geoRes = await fetch(GEO_URL).then(r => r.json())
        if (cancelled) return
        const features = geoRes.features || []
        setGeo({ type: 'FeatureCollection', features })
        try {
          const statsRes = await api.get('/api/public/stats/members-by-state')
          if (!cancelled) {
            setByState(statsRes.data.byState || emptyByState())
            setByStateDetail(statsRes.data.byStateDetail || {})
            setTotal(statsRes.data.total ?? 0)
          }
        } catch (err) {
          if (!cancelled) {
            setByState(emptyByState())
            setByStateDetail({})
            setTotal(0)
            setStatsError(err.response?.data?.message || err.message || 'Não foi possível carregar as quantidades. Verifique se o backend está no ar e se a API está acessível.')
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError('Não foi possível carregar o mapa.')
          setGeo({ type: 'FeatureCollection', features: [] })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return () => {
      if (tooltipHideTimeout.current) clearTimeout(tooltipHideTimeout.current)
    }
  }, [])

  const maxCount = Math.max(0, ...Object.values(byState))

  // Agregar instrumentos em todo o Brasil para a legenda
  const instrumentsLegend = (() => {
    const acc = {}
    Object.values(byStateDetail).forEach(d => {
      if (!d || !d.instruments) return
      Object.entries(d.instruments).forEach(([name, count]) => {
        if (name === '(não informado)') return
        acc[name] = (acc[name] || 0) + count
      })
    })
    return Object.entries(acc).sort((a, b) => b[1] - a[1])
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] rounded-2xl bg-rjb-card-light/50 dark:bg-rjb-card-dark/50 border border-rjb-yellow/20">
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70">Carregando mapa...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[320px] rounded-2xl bg-rjb-card-light/50 dark:bg-rjb-card-dark/50 border border-rjb-yellow/20">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {statsError && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-sm">
          {statsError}
        </div>
      )}
      <div className="rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light dark:bg-rjb-card-dark shadow-xl relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: MAP_CENTER,
            scale: 900,
          }}
          className="w-full aspect-[4/3] sm:aspect-[5/4]"
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup
            center={mapCenter}
            zoom={mapZoom}
            minZoom={0.8}
            maxZoom={2}
            onMoveEnd={({ zoom }) => {
              setMapZoom(zoom)
              setMapCenter(MAP_CENTER)
            }}
            filterZoomEvent={(e) => {
              if (!e || !e.sourceEvent) return false
              const ev = e.sourceEvent
              if (ev.type === 'wheel') return true
              const twoFingers = ev.touches && ev.touches.length >= 2
              if ((ev.type === 'touchstart' || ev.type === 'touchmove') && twoFingers) return true
              return false
            }}
          >
            <Geographies geography={geo}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const uf = (geo.id || geo.properties?.sigla || geo.properties?.SIGLA || '').toUpperCase()
                  const count = byState[uf] ?? 0
                  const fill = getFillColor(count, maxCount)
                  const name = (uf && UF_NAMES[uf]) || uf || 'Estado'
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth={0.6}
                      onMouseEnter={() => {
                        if (tooltipHideTimeout.current) {
                          clearTimeout(tooltipHideTimeout.current)
                          tooltipHideTimeout.current = null
                        }
                        tooltipOpenedAt.current = Date.now()
                        const detail = byStateDetail[uf]
                        setTooltip({
                          name,
                          uf,
                          count,
                          cities: detail ? Object.entries(detail.cities || {}).sort((a, b) => b[1] - a[1]) : [],
                          instruments: detail ? Object.entries(detail.instruments || {}).sort((a, b) => b[1] - a[1]) : [],
                        })
                      }}
                      onMouseLeave={() => {
                        if (Date.now() - tooltipOpenedAt.current < BACKDROP_IGNORE_MS) return
                        tooltipHideTimeout.current = setTimeout(() => setTooltip(null), TOOLTIP_HIDE_DELAY_MS)
                      }}
                      onClick={() => {
                        if (tooltipHideTimeout.current) {
                          clearTimeout(tooltipHideTimeout.current)
                          tooltipHideTimeout.current = null
                        }
                        tooltipOpenedAt.current = Date.now()
                        const detail = byStateDetail[uf]
                        setTooltip({
                          name,
                          uf,
                          count,
                          cities: detail ? Object.entries(detail.cities || {}).sort((a, b) => b[1] - a[1]) : [],
                          instruments: detail ? Object.entries(detail.instruments || {}).sort((a, b) => b[1] - a[1]) : [],
                        })
                      }}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', filter: 'brightness(1.08)', cursor: 'pointer' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        <button
          type="button"
          onClick={() => {
            setMapCenter(MAP_CENTER)
            setMapZoom(1)
          }}
          className="absolute top-3 right-3 p-2 rounded-lg bg-gray-900/80 dark:bg-gray-800/80 text-white hover:bg-gray-800 dark:hover:bg-gray-700 shadow-md transition-colors z-10"
          title="Recentralizar mapa"
          aria-label="Recentralizar mapa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        {tooltip && (
          <>
            {/* Backdrop: só em mobile; toque fora fecha */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-[2px]"
              onClick={() => {
                if (Date.now() - tooltipOpenedAt.current > BACKDROP_IGNORE_MS) setTooltip(null)
              }}
              aria-hidden
            />
            {/* Card: bottom sheet no mobile (não cobre o mapa), flutuante no desktop */}
            <div
              className="
                fixed left-0 right-0 bottom-0 z-50 max-h-[52vh] flex flex-col
                md:absolute md:left-1/2 md:right-auto md:bottom-4 md:max-h-[75vh] md:w-[min(90vw,360px)] md:-translate-x-1/2
                rounded-t-2xl md:rounded-2xl
                bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                shadow-[0_-8px_32px_rgba(0,0,0,0.2)] md:shadow-xl
                border border-gray-200/80 dark:border-gray-700/80 border-b-0 md:border-b
                transition-all duration-300 ease-out
              "
              onMouseEnter={() => {
                if (tooltipHideTimeout.current) {
                  clearTimeout(tooltipHideTimeout.current)
                  tooltipHideTimeout.current = null
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              role="dialog"
              aria-labelledby="map-tooltip-title"
            >
              {/* Handle + título + fechar (mobile) */}
              <div className="flex-shrink-0 flex flex-col items-center pt-2 pb-1 px-4 md:pt-3 md:pb-2 md:px-4 border-b border-gray-200/80 dark:border-gray-700/80">
                <span className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 md:hidden" aria-hidden />
                <div className="flex items-center justify-between w-full mt-2 md:mt-0">
                  <h3 id="map-tooltip-title" className="font-semibold text-base md:text-sm text-rjb-text dark:text-rjb-text-dark">
                    {tooltip.name} · {tooltip.count === 1 ? '1 componente' : `${tooltip.count} componentes`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTooltip(null)}
                    className="md:hidden p-2 -mr-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                    aria-label="Fechar"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Conteúdo rolável */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 touch-pan-y overscroll-contain">
                {tooltip.cities.length > 0 && (
                  <section className="mb-3">
                    <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">Cidades</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                      {tooltip.cities.map(([city, n]) => (
                        <li key={city}>{city}: {n}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {tooltip.instruments.length > 0 && (
                  <section>
                    <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">Instrumentos</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                      {tooltip.instruments.map(([inst, n]) => (
                        <li key={inst}>{inst}: {n}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-rjb-text/80 dark:text-rjb-text-dark/80">
          <span className="font-medium">
            Total: <strong className="text-rjb-text dark:text-rjb-text-dark">{total}</strong> {total === 1 ? 'componente' : 'componentes'}
          </span>
          {maxCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-rjb-text/70 dark:text-rjb-text-dark/70">Quantidade por estado:</span>
              <span className="flex items-center gap-1.5" role="img" aria-label="Escala: menos a mais componentes">
                <span className="w-4 h-3 rounded-sm border border-gray-300/60 dark:border-gray-600/60" style={{ background: '#e5e7eb' }} title="0 componentes" />
                <span className="text-[10px] text-rjb-text/60 dark:text-rjb-text-dark/60">0</span>
                <span className="w-4 h-3 rounded-sm border border-gray-300/60 dark:border-gray-600/60" style={{ background: getFillColor(1, maxCount) }} title="Poucos" />
                <span className="w-4 h-3 rounded-sm border border-gray-300/60 dark:border-gray-600/60" style={{ background: getFillColor(maxCount, maxCount) }} title="Máximo no estado" />
                <span className="text-[10px] text-rjb-text/60 dark:text-rjb-text-dark/60">máx.</span>
              </span>
            </div>
          )}
        </div>
        {instrumentsLegend.length > 0 && (
          <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light/80 dark:bg-rjb-card-dark/80 p-4 text-xs">
            <h4 className="font-semibold text-rjb-text dark:text-rjb-text-dark mb-2.5">Instrumentos no Brasil</h4>
            <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 mb-2">Quantidade total de componentes por instrumento em todos os estados:</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-rjb-text/85 dark:text-rjb-text-dark/85">
              {instrumentsLegend.map(([name, count]) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500/80 shrink-0" aria-hidden />
                  <span>{name}: <strong className="text-rjb-text dark:text-rjb-text-dark">{count}</strong></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrazilMap
