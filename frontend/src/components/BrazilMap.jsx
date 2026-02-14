import { useState, useEffect } from 'react'
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

const BrazilMap = () => {
  const [byState, setByState] = useState({})
  const [byStateDetail, setByStateDetail] = useState({})
  const [total, setTotal] = useState(0)
  const [geo, setGeo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statsError, setStatsError] = useState(null)
  const [tooltip, setTooltip] = useState(null)

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
      <div className="rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light dark:bg-rjb-card-dark shadow-xl">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [-54, -15],
            scale: 900,
          }}
          className="w-full aspect-[4/3] sm:aspect-[5/4]"
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup center={[-54, -15]} zoom={1} minZoom={0.8} maxZoom={2}>
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
                        const detail = byStateDetail[uf]
                        setTooltip({
                          name,
                          uf,
                          count,
                          cities: detail ? Object.entries(detail.cities || {}).sort((a, b) => b[1] - a[1]) : [],
                          instruments: detail ? Object.entries(detail.instruments || {}).sort((a, b) => b[1] - a[1]) : [],
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
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
        {tooltip && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(90vw,320px)] max-h-[50vh] overflow-y-auto px-4 py-3 rounded-xl bg-gray-900/95 dark:bg-gray-800/95 text-white text-sm shadow-lg pointer-events-none z-10"
          >
            <div className="font-semibold border-b border-white/20 pb-1.5 mb-2">
              {tooltip.name} · {tooltip.count === 1 ? '1 componente' : `${tooltip.count} componentes`}
            </div>
            {tooltip.cities.length > 0 && (
              <div className="mb-2">
                <div className="text-amber-200/90 text-xs font-medium mb-0.5">Cidades</div>
                <ul className="text-xs space-y-0.5 text-white/90">
                  {tooltip.cities.slice(0, 8).map(([city, n]) => (
                    <li key={city}>{city}: {n}</li>
                  ))}
                  {tooltip.cities.length > 8 && <li className="text-white/60">+{tooltip.cities.length - 8} mais</li>}
                </ul>
              </div>
            )}
            {tooltip.instruments.length > 0 && (
              <div>
                <div className="text-amber-200/90 text-xs font-medium mb-0.5">Instrumentos</div>
                <ul className="text-xs space-y-0.5 text-white/90">
                  {tooltip.instruments.slice(0, 6).map(([inst, n]) => (
                    <li key={inst}>{inst}: {n}</li>
                  ))}
                  {tooltip.instruments.length > 6 && <li className="text-white/60">+{tooltip.instruments.length - 6} mais</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-rjb-text/70 dark:text-rjb-text-dark/70">
          <span>Total: <strong className="text-rjb-text dark:text-rjb-text-dark">{total}</strong> {total === 1 ? 'componente' : 'componentes'}</span>
          {maxCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shadow-inner" style={{ background: '#e5e7eb' }} title="Nenhum" />
              <span className="w-3 h-3 rounded-sm shadow-inner" style={{ background: getFillColor(1, 1) }} title="Poucos" />
              <span className="w-3 h-3 rounded-sm shadow-inner" style={{ background: getFillColor(maxCount, maxCount) }} title="Maior quantidade" />
              <span>menor → maior (por estado)</span>
            </span>
          )}
        </div>
        {instrumentsLegend.length > 0 && (
          <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light/80 dark:bg-rjb-card-dark/80 p-3 text-xs">
            <div className="font-semibold text-rjb-text dark:text-rjb-text-dark mb-2">Legenda — Instrumentos (total no Brasil)</div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-rjb-text/80 dark:text-rjb-text-dark/80">
              {instrumentsLegend.map(([name, count]) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500/80" aria-hidden />
                  <span>{name}: <strong>{count}</strong></span>
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
