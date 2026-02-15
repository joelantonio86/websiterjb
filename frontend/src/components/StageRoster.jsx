import { useState, useEffect } from 'react'
import api from '../services/api'

const UF_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
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

  const byState = roster.reduce((acc, item) => {
    const uf = item.state || ''
    if (!acc[uf]) acc[uf] = []
    acc[uf].push(item)
    return acc
  }, {})
  const states = Object.keys(byState).sort()

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light/50 dark:bg-rjb-card-dark/50 p-8 text-center">
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70">Carregando mapa de palco...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-4 text-center">
        <p className="text-amber-800 dark:text-amber-200 text-sm">{error}</p>
      </div>
    )
  }

  if (roster.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light dark:bg-rjb-card-dark p-6 text-center">
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70">Nenhum componente cadastrado no mapa de palco.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {states.map((uf) => (
        <div key={uf} className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light dark:bg-rjb-card-dark overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-200/80 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-800/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-rjb-yellow">
              {uf}
            </span>
            <span className="ml-2 text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
              {UF_NAMES[uf] || uf}
            </span>
            <span className="ml-2 text-xs text-rjb-text/50 dark:text-rjb-text-dark/50">
              · {byState[uf].length} {byState[uf].length === 1 ? 'componente' : 'componentes'}
            </span>
          </div>
          <div className="p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3">
            {byState[uf].map((item, idx) => (
              <div
                key={`${uf}-${idx}-${item.displayName}-${item.instrument}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 shadow-sm hover:shadow-md hover:border-rjb-yellow/30 dark:hover:border-rjb-yellow/30 transition-all duration-200"
              >
                <span className="font-semibold text-sm text-rjb-text dark:text-rjb-text-dark">
                  {item.displayName}
                </span>
                <span className="text-xs font-medium text-rjb-yellow bg-rjb-yellow/10 dark:bg-rjb-yellow/20 px-1.5 py-0.5 rounded">
                  {item.state}
                </span>
                <span className="text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 border-l border-gray-200 dark:border-gray-600 pl-2">
                  {item.instrument}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StageRoster
