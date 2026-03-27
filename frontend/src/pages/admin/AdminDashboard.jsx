import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

const StatCard = ({ title, value }) => (
  <div className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 shadow-lg p-5">
    <p className="text-xs sm:text-sm text-rjb-text/65 dark:text-rjb-text-dark/65">{title}</p>
    <p className="text-2xl sm:text-3xl font-extrabold mt-1 text-rjb-text dark:text-rjb-text-dark">{value}</p>
  </div>
)

const DistributionCard = ({ title, subtitle, data, emptyLabel = 'Sem dados disponíveis.' }) => (
  <div className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 shadow-lg p-4 sm:p-5">
    <h3 className="text-base sm:text-lg font-bold text-rjb-text dark:text-rjb-text-dark">{title}</h3>
    <p className="text-xs sm:text-sm text-rjb-text/65 dark:text-rjb-text-dark/65 mt-1">{subtitle}</p>
    {data.length === 0 ? (
      <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mt-4">{emptyLabel}</p>
    ) : (
      <ul className="space-y-2.5 sm:space-y-3 mt-4 max-h-[320px] sm:max-h-[420px] overflow-y-auto pr-1">
        {data.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="min-w-0 break-words font-medium text-rjb-text dark:text-rjb-text-dark">{item.label}</span>
              <span className="shrink-0 rounded-full bg-rjb-yellow/15 px-2 py-0.5 text-rjb-text/80 dark:text-rjb-text-dark/80">
                {item.value}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-rjb-yellow/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rjb-yellow to-yellow-500"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
)

const UF_TO_REGION = {
  AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
}

const normalizeLabel = (value, fallback = 'Não informado') => {
  const label = String(value || '').trim()
  return label || fallback
}

const normalizeState = (value) => {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw) return ''
  if (raw.length === 2) return raw
  const noAccents = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const alias = {
    ACRE: 'AC',
    ALAGOAS: 'AL',
    AMAPA: 'AP',
    AMAZONAS: 'AM',
    BAHIA: 'BA',
    CEARA: 'CE',
    'DISTRITO FEDERAL': 'DF',
    'ESPIRITO SANTO': 'ES',
    GOIAS: 'GO',
    MARANHAO: 'MA',
    'MATO GROSSO': 'MT',
    'MATO GROSSO DO SUL': 'MS',
    'MINAS GERAIS': 'MG',
    PARA: 'PA',
    PARAIBA: 'PB',
    PARANA: 'PR',
    PERNAMBUCO: 'PE',
    PIAUI: 'PI',
    'RIO DE JANEIRO': 'RJ',
    'RIO GRANDE DO NORTE': 'RN',
    'RIO GRANDE DO SUL': 'RS',
    RONDONIA: 'RO',
    RORAIMA: 'RR',
    'SANTA CATARINA': 'SC',
    'SAO PAULO': 'SP',
    SERGIPE: 'SE',
    TOCANTINS: 'TO',
  }
  return alias[noAccents] || raw
}

const toDistribution = (mapObj, limit) => {
  const entries = Object.entries(mapObj).sort((a, b) => b[1] - a[1])
  const sliced = typeof limit === 'number' ? entries.slice(0, limit) : entries
  const max = sliced[0]?.[1] || 1
  return sliced.map(([label, value]) => ({
    label,
    value,
    percent: Math.max(6, Math.round((value / max) * 100)),
  }))
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({ members: 0, attachments: 0, system: 'Ativo' })
  const [members, setMembers] = useState([])

  useEffect(() => {
    const load = async () => {
      const [membersRes, attachmentsRes] = await Promise.all([
        api.get('/api/reports/members').catch(() => ({ data: { allMembers: [] } })),
        api.get('/api/attachments/list').catch(() => ({ data: [] })),
      ])
      const allMembers = membersRes.data.allMembers || []
      setStats({
        members: allMembers.length || 0,
        attachments: attachmentsRes.data?.length || 0,
        system: 'Ativo',
      })
      setMembers(allMembers)
    }
    load()
  }, [])

  const instrumentData = useMemo(() => {
    const grouped = {}
    members.forEach((member) => {
      const key = normalizeLabel(member.instrument)
      grouped[key] = (grouped[key] || 0) + 1
    })
    return toDistribution(grouped)
  }, [members])

  const stateData = useMemo(() => {
    const grouped = {}
    members.forEach((member) => {
      const normalized = normalizeState(member.state)
      const key = normalized || 'Não informado'
      grouped[key] = (grouped[key] || 0) + 1
    })
    return toDistribution(grouped, 10)
  }, [members])

  const regionData = useMemo(() => {
    const grouped = {}
    members.forEach((member) => {
      const normalizedState = normalizeState(member.state)
      const region = UF_TO_REGION[normalizedState] || 'Não informado'
      grouped[region] = (grouped[region] || 0) + 1
    })
    return toDistribution(grouped)
  }, [members])

  return (
    <section className="space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Dashboard</h2>
        <p className="text-xs sm:text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">Visão geral rápida do painel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard title="Membros cadastrados" value={stats.members} />
        <StatCard title="Arquivos de mídia" value={stats.attachments} />
        <StatCard title="Status do sistema" value={stats.system} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DistributionCard
          title="Membros por instrumento"
          subtitle="Distribuição dos cadastros por instrumento/naipe."
          data={instrumentData}
        />
        <DistributionCard
          title="Membros por região"
          subtitle="Concentração de membros por macro-região do Brasil."
          data={regionData}
        />
      </div>

      <DistributionCard
        title="Top estados com mais membros"
        subtitle="Ranking dos 10 estados com maior número de cadastros."
        data={stateData}
      />
    </section>
  )
}

export default AdminDashboard

