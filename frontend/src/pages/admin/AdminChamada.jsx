import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { showMessage } from '../../components/MessageBox'
import { naipeKey, naipeLabel } from '../../utils/stageLayout'
import { buildStageMap, mergeChamada, validateChamada } from '../../utils/chamadaModel'
import { downloadStageMapPdf } from '../../utils/chamadaPdf'

const formatDate = (iso) => {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return 'Data a confirmar'
  return `${match[3]}/${match[2]}/${match[1]}`
}

const statusButton = (active, tone) => {
  const tones = {
    presente: active ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-700/30 text-emerald-800 dark:text-emerald-300',
    falta: active ? 'bg-red-700 text-white border-red-700' : 'border-red-700/30 text-red-800 dark:text-red-300',
    suplente: active ? 'bg-amber-600 text-white border-amber-600' : 'border-amber-700/30 text-amber-900 dark:text-amber-300',
  }
  return `px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${tones[tone]}`
}

const StageMapPreview = ({ event, stageMap }) => (
  <div className="rounded-2xl bg-white text-stone-900 shadow-lg p-4 sm:p-6 overflow-x-auto">
    <div className="text-center mb-4">
      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-rjb-yellow-ink">Orquestra Universo em Desencanto</p>
      <h3 className="text-lg sm:text-xl font-bold">{event?.name || 'Apresentação'}</h3>
      <p className="text-sm text-stone-600">
        {formatDate(event?.date)}
        {event?.location ? ` · ${event.location}` : ''}
      </p>
    </div>
    {stageMap.sections.length === 0 ? (
      <p className="text-sm text-center text-stone-500">Ninguém marcado para subir ao palco.</p>
    ) : (
      stageMap.sections.map((section) => (
        <section key={section.id} className="mb-4">
          <h4 className="text-sm font-bold text-amber-900 text-center">{section.title}</h4>
          {section.subtitle && <p className="text-[11px] text-center text-stone-500 mb-2">{section.subtitle}</p>}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {section.items.map((item) => (
              <article key={item.memberId} className="w-[108px] rounded-lg border border-amber-300 border-l-4 border-l-amber-600 bg-amber-50 px-2 py-1.5 text-center">
                <p className="text-[11px] font-bold leading-tight">{item.displayName}</p>
                <p className="text-[10px] leading-tight text-stone-700">{item.instrument}</p>
                <p className="text-[10px] font-medium">{item.state}</p>
                {item.status === 'suplente' && (
                  <p className="text-[9px] text-amber-800 leading-tight mt-0.5">
                    {item.replacesName ? `Suplente de ${item.replacesName}` : 'Suplente'}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      ))
    )}
    {stageMap.absent.length > 0 && (
      <p className="mt-3 text-xs text-stone-600">
        <span className="font-semibold">Faltas: </span>
        {stageMap.absent.map((row) => `${row.name} (${row.instrument})`).join(' · ')}
      </p>
    )}
  </div>
)

const AdminChamada = () => {
  const [events, setEvents] = useState([])
  const [eventId, setEventId] = useState('')
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState('naipe')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [loadedEventId, setLoadedEventId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [eventsRes, membersRes] = await Promise.all([
          api.get('/api/admin/repertorios'),
          api.get('/api/reports/members'),
        ])
        if (!mounted) return
        const list = Array.isArray(eventsRes.data) ? eventsRes.data : []
        list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        setEvents(list)
        if (list[0]) setEventId(list[0].id)
        else {
          setRows([])
          setLoading(false)
        }
      } catch (err) {
        if (!mounted) return
        setError(err.response?.data?.message || 'Não foi possível carregar eventos e membros.')
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!eventId) return undefined
    let mounted = true
    const loadCall = async () => {
      setLoading(true)
      setError('')
      try {
        const [callRes, membersRes] = await Promise.all([
          api.get(`/api/admin/chamadas/${eventId}`),
          api.get('/api/reports/members'),
        ])
        if (!mounted) return
        setRows(mergeChamada(membersRes.data?.allMembers || [], callRes.data?.entries || []))
        setLoadedEventId(eventId)
        setDirty(false)
      } catch (err) {
        if (!mounted) return
        setRows([])
        setLoadedEventId('')
        setError(err.response?.data?.message || 'Não foi possível carregar a chamada deste evento.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadCall()
    return () => { mounted = false }
  }, [eventId])

  const event = events.find((item) => item.id === eventId) || null
  const callReady = Boolean(eventId) && loadedEventId === eventId && !loading
  const stageMap = useMemo(() => buildStageMap(rows), [rows])
  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const filtered = term
      ? rows.filter((row) => row.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term)
        || row.instrument.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term))
      : rows
    if (sortMode === 'nome') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    }
    return filtered
  }, [rows, query, sortMode])

  const updateRow = (memberId, patch) => {
    setRows((current) => current.map((row) => (row.memberId === memberId ? { ...row, ...patch } : row)))
    setDirty(true)
  }

  const setStatus = (memberId, status) => {
    setRows((current) => current.map((row) => {
      if (row.memberId === memberId) {
        return { ...row, status, replacesMemberId: status === 'suplente' ? row.replacesMemberId : '' }
      }
      if (status !== 'falta' && row.replacesMemberId === memberId) {
        return { ...row, status: 'presente', replacesMemberId: '' }
      }
      return row
    }))
    setDirty(true)
  }

  const save = async () => {
    const validation = validateChamada(rows)
    if (validation) {
      showMessage(validation, true)
      return
    }
    setSaving(true)
    try {
      await api.put(`/api/admin/chamadas/${eventId}`, {
        entries: rows.map((row) => ({
          memberId: row.memberId,
          status: row.status,
          replacesMemberId: row.replacesMemberId,
        })),
      })
      setDirty(false)
      showMessage('Chamada salva.')
    } catch (err) {
      showMessage(err.response?.data?.message || 'Não foi possível salvar a chamada.', true)
    } finally {
      setSaving(false)
    }
  }

  const download = () => {
    const validation = validateChamada(rows)
    if (validation) {
      showMessage(validation, true)
      return
    }
    downloadStageMapPdf({ event, stageMap })
  }

  const changeEvent = (nextId) => {
    if (nextId === eventId) return
    if (dirty && !window.confirm('Há alterações sem salvar. Trocar de evento mesmo assim?')) return
    setEventId(nextId)
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Chamada</h2>
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
          Marque quem sobe em cada apresentação. O mapa em PDF mostra presentes e suplentes, na ordem dos naipes.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 shadow-lg p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="font-semibold text-rjb-text dark:text-rjb-text-dark">Evento</span>
            <select
              value={eventId}
              onChange={(e) => changeEvent(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark"
            >
              {events.length === 0 && <option value="">Nenhum evento cadastrado</option>}
              {events.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatDate(item.date)} — {item.name}{item.archived ? ' (arquivado)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-rjb-text dark:text-rjb-text-dark">Buscar</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome ou instrumento"
              className="mt-1 w-full p-3 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ordem da lista">
          <span className="text-xs font-semibold text-rjb-text/70 dark:text-rjb-text-dark/70">Ordem</span>
          <button
            type="button"
            onClick={() => setSortMode('naipe')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${sortMode === 'naipe' ? 'bg-rjb-yellow text-rjb-text border-rjb-yellow' : 'border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark'}`}
          >
            Por naipe
          </button>
          <button
            type="button"
            onClick={() => setSortMode('nome')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${sortMode === 'nome' ? 'bg-rjb-yellow text-rjb-text border-rjb-yellow' : 'border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark'}`}
          >
            Por nome
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!callReady || saving}
            className="bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-2.5 px-4 rounded-xl disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar chamada'}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={!callReady || rows.length === 0}
            className="border border-rjb-yellow/50 text-rjb-gold font-semibold py-2.5 px-4 rounded-xl disabled:opacity-50"
          >
            Baixar PDF
          </button>
          <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60">
            {stageMap.onStage.length} no palco · {stageMap.absent.length} falta{stageMap.absent.length === 1 ? '' : 's'}
            {dirty ? ' · alterações sem salvar' : ''}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">Carregando chamada...</p>
        ) : (
          <ul className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {visibleRows.map((row) => {
              const replacements = rows.filter((candidate) =>
                candidate.memberId !== row.memberId
                && candidate.status === 'falta'
                && naipeKey(candidate.instrument) === naipeKey(row.instrument)
                && !rows.some((other) => other.memberId !== row.memberId && other.replacesMemberId === candidate.memberId)
              )
              return (
                <li key={row.memberId} className="rounded-xl border border-rjb-yellow/15 bg-rjb-bg-light/60 dark:bg-rjb-bg-dark/40 p-3">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-rjb-text dark:text-rjb-text-dark">{row.name}</p>
                      <p className="text-xs text-rjb-text/65 dark:text-rjb-text-dark/65">
                        {row.instrument} · {row.state} · {naipeLabel(row.instrument)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" className={statusButton(row.status === 'presente', 'presente')} onClick={() => setStatus(row.memberId, 'presente')}>Presente</button>
                      <button type="button" className={statusButton(row.status === 'falta', 'falta')} onClick={() => setStatus(row.memberId, 'falta')}>Falta</button>
                      <button type="button" className={statusButton(row.status === 'suplente', 'suplente')} onClick={() => setStatus(row.memberId, 'suplente')}>Suplente</button>
                    </div>
                  </div>
                  {row.status === 'suplente' && (
                    <label className="block mt-2 text-xs">
                      <span className="text-rjb-text/70 dark:text-rjb-text-dark/70">Substitui</span>
                      <select
                        value={row.replacesMemberId}
                        onChange={(e) => updateRow(row.memberId, { replacesMemberId: e.target.value })}
                        className="mt-1 w-full p-2 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark"
                      >
                        <option value="">Escolha quem faltou neste naipe</option>
                        {row.replacesMemberId && !replacements.some((item) => item.memberId === row.replacesMemberId) && (
                          <option value={row.replacesMemberId}>
                            {rows.find((item) => item.memberId === row.replacesMemberId)?.name || 'Pessoa selecionada'}
                          </option>
                        )}
                        {replacements.map((candidate) => (
                          <option key={candidate.memberId} value={candidate.memberId}>
                            {candidate.name} · {candidate.instrument}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-rjb-text dark:text-rjb-text-dark mb-2">Pré-visualização do mapa</h3>
        {callReady ? (
          <StageMapPreview event={event} stageMap={stageMap} />
        ) : (
          <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">Carregando o mapa deste evento...</p>
        )}
      </div>
    </section>
  )
}

export default AdminChamada
