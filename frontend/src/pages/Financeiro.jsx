import { useState, useEffect, useCallback } from 'react'
import PageWrapper from '../components/PageWrapper'
import { useAuth } from '../contexts/AuthContext'
import { showMessage } from '../components/MessageBox'
import { showLoader } from '../components/LoadingOverlay'
import api from '../services/api'

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MONTHLY_CONTRIBUTION = 20
const EXPENSE_CATEGORIES = [
  { value: 'lanche', label: 'Lanche' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'evento', label: 'Evento' },
  { value: 'outros', label: 'Outros' },
]

const formatMoney = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`

const normalizeText = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const Financeiro = () => {
  const { user } = useAuth()
  const canWrite = user?.role === 'admin-financeiro'

  const [activeTab, setActiveTab] = useState('reports')
  const [contributions, setContributions] = useState([])
  const [deposits, setDeposits] = useState([])
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [paymentReport, setPaymentReport] = useState([])
  const [cashFlow, setCashFlow] = useState(null)
  const [contributionSearch, setContributionSearch] = useState('')
  const [depositSearch, setDepositSearch] = useState('')
  const [expenseSearch, setExpenseSearch] = useState('')
  const [reportSearch, setReportSearch] = useState('')
  const [reportYear, setReportYear] = useState('')
  const [reportMonth, setReportMonth] = useState('')
  const [modalContribution, setModalContribution] = useState(null)
  const [modalDeposit, setModalDeposit] = useState(null)
  const [modalExpense, setModalExpense] = useState(null)

  const fetchContributions = useCallback(async () => {
    try {
      const res = await api.get('/api/finance/contributions')
      setContributions(res.data.contributions || [])
    } catch (e) {
      showMessage('Erro ao carregar contribuições.', true)
    }
  }, [])

  const fetchDeposits = useCallback(async () => {
    try {
      const res = await api.get('/api/finance/deposits')
      setDeposits(res.data.deposits || [])
    } catch (e) {
      showMessage('Erro ao carregar depósitos.', true)
    }
  }, [])

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.get('/api/finance/expenses')
      setExpenses(res.data.expenses || [])
    } catch (e) {
      showMessage('Erro ao carregar gastos.', true)
    }
  }, [])

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/api/reports/members')
      setMembers(res.data.allMembers || [])
    } catch (e) {
      showMessage('Erro ao carregar membros.', true)
    }
  }, [])

  const fetchPaymentReport = useCallback(async () => {
    showLoader(true, 'Gerando relatório...')
    try {
      const params = {}
      if (reportYear) params.year = reportYear
      if (reportMonth) params.month = reportMonth
      const res = await api.get('/api/finance/reports/payments', { params })
      setPaymentReport(res.data.report || [])
    } catch (e) {
      showMessage('Erro ao carregar relatório de pagamentos.', true)
    } finally {
      showLoader(false)
    }
  }, [reportYear, reportMonth])

  const fetchCashFlow = useCallback(async () => {
    showLoader(true, 'Carregando valor em caixa...')
    try {
      const res = await api.get('/api/finance/reports/cash-flow')
      setCashFlow(res.data)
    } catch (e) {
      showMessage('Erro ao carregar relatório de caixa.', true)
    } finally {
      showLoader(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'contributions') {
      fetchContributions()
      fetchMembers()
    } else if (activeTab === 'deposits') {
      fetchDeposits()
      fetchMembers()
    } else if (activeTab === 'expenses') {
      fetchExpenses()
    } else if (activeTab === 'reports') {
      fetchPaymentReport()
      fetchCashFlow()
    }
  }, [activeTab, fetchContributions, fetchDeposits, fetchExpenses, fetchMembers, fetchPaymentReport, fetchCashFlow])

  const filteredContributions = contributionSearch
    ? contributions.filter(c => normalizeText(c.memberName).includes(normalizeText(contributionSearch)))
    : contributions
  const filteredDeposits = depositSearch
    ? deposits.filter(d => normalizeText(d.memberName).includes(normalizeText(depositSearch)))
    : deposits
  const filteredExpenses = expenseSearch
    ? expenses.filter(e => normalizeText(e.description).includes(normalizeText(expenseSearch)))
    : expenses
  const filteredPaymentReport = reportSearch
    ? paymentReport.filter(r => normalizeText(r.memberName).includes(normalizeText(reportSearch)))
    : paymentReport

  const totalContributionsPaid = filteredContributions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0)
  const totalDepositsSum = filteredDeposits.reduce((s, d) => s + (d.amount || 0), 0)
  const totalExpensesSum = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0)

  const saveContribution = async (payload, receiptFile) => {
    if (!canWrite) return
    showLoader(true)
    try {
      let receiptUrl = payload.receiptUrl || ''
      if (receiptFile) {
        const fd = new FormData()
        fd.append('receipt', receiptFile)
        const up = await api.post('/api/finance/contributions/receipt', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        receiptUrl = up.data.receiptUrl || ''
      }
      const body = { ...payload, receiptUrl }
      if (payload.id) {
        await api.put(`/api/finance/contributions/${payload.id}`, body)
        showMessage('Contribuição atualizada.')
      } else {
        await api.post('/api/finance/contributions', body)
        showMessage('Contribuição registrada.')
      }
      setModalContribution(null)
      fetchContributions()
    } catch (e) {
      showMessage(e.response?.data?.message || 'Erro ao salvar contribuição.', true)
    } finally {
      showLoader(false)
    }
  }

  const deleteContribution = async (id) => {
    if (!canWrite || !window.confirm('Excluir esta contribuição?')) return
    showLoader(true)
    try {
      await api.delete(`/api/finance/contributions/${id}`)
      showMessage('Contribuição excluída.')
      setModalContribution(null)
      fetchContributions()
    } catch (e) {
      showMessage('Erro ao excluir.', true)
    } finally {
      showLoader(false)
    }
  }

  const saveDeposit = async (payload, receiptFile) => {
    if (!canWrite) return
    showLoader(true)
    try {
      let receiptUrl = payload.receiptUrl || ''
      if (receiptFile) {
        const fd = new FormData()
        fd.append('receipt', receiptFile)
        const up = await api.post('/api/finance/deposits/receipt', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        receiptUrl = up.data.receiptUrl || ''
      }
      const body = { ...payload, receiptUrl, depositDate: payload.depositDate }
      if (payload.id) {
        await api.put(`/api/finance/deposits/${payload.id}`, body)
        showMessage('Depósito atualizado.')
      } else {
        await api.post('/api/finance/deposits', body)
        showMessage('Depósito registrado.')
      }
      setModalDeposit(null)
      fetchDeposits()
    } catch (e) {
      showMessage(e.response?.data?.message || 'Erro ao salvar depósito.', true)
    } finally {
      showLoader(false)
    }
  }

  const deleteDeposit = async (id) => {
    if (!canWrite || !window.confirm('Excluir este depósito?')) return
    showLoader(true)
    try {
      await api.delete(`/api/finance/deposits/${id}`)
      showMessage('Depósito excluído.')
      setModalDeposit(null)
      fetchDeposits()
    } catch (e) {
      showMessage('Erro ao excluir.', true)
    } finally {
      showLoader(false)
    }
  }

  const saveExpense = async (payload, receiptFile) => {
    if (!canWrite) return
    showLoader(true)
    try {
      let receiptUrl = payload.receiptUrl || ''
      if (receiptFile) {
        const fd = new FormData()
        fd.append('receipt', receiptFile)
        const up = await api.post('/api/finance/expenses/receipt', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        receiptUrl = up.data.receiptUrl || ''
      }
      const body = { ...payload, receiptUrl, expenseDate: payload.expenseDate }
      if (payload.id) {
        await api.put(`/api/finance/expenses/${payload.id}`, body)
        showMessage('Gasto atualizado.')
      } else {
        await api.post('/api/finance/expenses', body)
        showMessage('Gasto registrado.')
      }
      setModalExpense(null)
      fetchExpenses()
    } catch (e) {
      showMessage(e.response?.data?.message || 'Erro ao salvar gasto.', true)
    } finally {
      showLoader(false)
    }
  }

  const deleteExpense = async (id) => {
    if (!canWrite || !window.confirm('Excluir este gasto?')) return
    showLoader(true)
    try {
      await api.delete(`/api/finance/expenses/${id}`)
      showMessage('Gasto excluído.')
      setModalExpense(null)
      fetchExpenses()
    } catch (e) {
      showMessage('Erro ao excluir.', true)
    } finally {
      showLoader(false)
    }
  }

  const tabs = [
    { id: 'contributions', label: 'Contribuições' },
    { id: 'deposits', label: 'Depósitos' },
    { id: 'expenses', label: 'Gastos' },
    { id: 'reports', label: 'Relatórios' },
  ]

  return (
    <PageWrapper title="Área Financeira">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-8 sm:pb-12">
        {/* Hero / Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 dark:from-green-500/15 dark:to-green-600/5 ring-1 ring-green-600/20 dark:ring-green-500/20">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-green-600 dark:text-green-500">
                Área Financeira
              </h1>
              <p className="mt-1 text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70">
                Controle de contribuições, depósitos e gastos da RJB
              </p>
            </div>
          </div>
        </header>

        {/* Tabs: scroll horizontal no mobile com snap, pill no desktop */}
        <nav
          className="flex gap-1 sm:gap-2 mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory"
          role="tablist"
          aria-label="Seções da área financeira"
        >
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 min-h-[44px] sm:min-h-0 px-4 sm:px-5 py-3 sm:py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl sm:rounded-lg border-2 transition-all duration-200 snap-start touch-manipulation ${
                activeTab === t.id
                  ? 'border-green-600 bg-green-600 text-white shadow-lg shadow-green-600/25 dark:shadow-green-500/20'
                  : 'border-gray-200 dark:border-gray-600 bg-rjb-card-light dark:bg-rjb-card-dark text-rjb-text/80 dark:text-rjb-text-dark/80 hover:border-green-500/50 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Tab: Contribuições */}
        {activeTab === 'contributions' && (
          <section className="animate-fade-in" aria-labelledby="contrib-title">
            <div className="rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-none border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-rjb-card-light dark:bg-rjb-card-dark ring-1 ring-black/5 dark:ring-white/5">
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-green-600/10 via-green-600/5 to-transparent dark:from-green-600/15 dark:via-green-600/10 border-b border-green-600/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 id="contrib-title" className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark">Contribuições Mensais</h2>
                  <p className="mt-0.5 text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">Valor mensal: <span className="font-semibold text-green-600 dark:text-green-500">R$ 20,00</span></p>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setModalContribution({})}
                    className="min-h-[44px] w-full sm:w-auto sm:min-h-0 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-green-600/20 transition-all touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Nova Contribuição
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Buscar por nome..."
                    value={contributionSearch}
                    onChange={e => setContributionSearch(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark placeholder:text-gray-500 focus:ring-2 focus:ring-green-500/40 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div className="mb-6 p-4 sm:p-5 rounded-xl bg-green-50/80 dark:bg-green-900/20 border border-green-200/80 dark:border-green-800/80 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-green-800 dark:text-green-200">Total Pago</span>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">{formatMoney(totalContributionsPaid)}</span>
                </div>
                <ContributionsList
                contributions={filteredContributions}
                canWrite={canWrite}
                onEdit={c => setModalContribution(c)}
                onDelete={deleteContribution}
              />
              </div>
            </div>
          </section>
        )}

        {/* Tab: Depósitos */}
        {activeTab === 'deposits' && (
          <section className="animate-fade-in" aria-labelledby="deposits-title">
            <div className="rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-none border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-rjb-card-light dark:bg-rjb-card-dark ring-1 ring-black/5 dark:ring-white/5">
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-green-600/10 via-green-600/5 to-transparent dark:from-green-600/15 dark:via-green-600/10 border-b border-green-600/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 id="deposits-title" className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark">Depósitos e Comprovantes</h2>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setModalDeposit({})}
                    className="min-h-[44px] w-full sm:w-auto sm:min-h-0 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-green-600/20 transition-all touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Novo Depósito
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Buscar por nome..."
                    value={depositSearch}
                    onChange={e => setDepositSearch(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark placeholder:text-gray-500 focus:ring-2 focus:ring-green-500/40 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div className="mb-6 p-4 sm:p-5 rounded-xl bg-green-50/80 dark:bg-green-900/20 border border-green-200/80 dark:border-green-800/80 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-green-800 dark:text-green-200">Total de Depósitos</span>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">{formatMoney(totalDepositsSum)}</span>
                </div>
                <DepositsList
                deposits={filteredDeposits}
                canWrite={canWrite}
                onEdit={d => setModalDeposit(d)}
                onDelete={deleteDeposit}
              />
              </div>
            </div>
          </section>
        )}

        {/* Tab: Gastos */}
        {activeTab === 'expenses' && (
          <section className="animate-fade-in" aria-labelledby="expenses-title">
            <div className="rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-none border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-rjb-card-light dark:bg-rjb-card-dark ring-1 ring-black/5 dark:ring-white/5">
              <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-red-600/10 via-red-600/5 to-transparent dark:from-red-600/15 dark:via-red-600/10 border-b border-red-600/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 id="expenses-title" className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark">Gastos da RJB</h2>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setModalExpense({})}
                    className="min-h-[44px] w-full sm:w-auto sm:min-h-0 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-red-600/20 transition-all touch-manipulation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Novo Gasto
                  </button>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Buscar por descrição..."
                    value={expenseSearch}
                    onChange={e => setExpenseSearch(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark placeholder:text-gray-500 focus:ring-2 focus:ring-red-500/40 focus:border-red-500 outline-none transition-all"
                  />
                </div>
                <div className="mb-6 p-4 sm:p-5 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/80 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-red-800 dark:text-red-200">Total de Gastos</span>
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{formatMoney(totalExpensesSum)}</span>
                </div>
                <ExpensesList
                  expenses={filteredExpenses}
                  canWrite={canWrite}
                  onEdit={e => setModalExpense(e)}
                  onDelete={deleteExpense}
                />
              </div>
            </div>
          </section>
        )}

        {/* Tab: Relatórios */}
        {activeTab === 'reports' && (
          <section className="animate-fade-in space-y-6" aria-labelledby="reports-title">
            <div className="rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-none border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-rjb-card-light dark:bg-rjb-card-dark ring-1 ring-black/5 dark:ring-white/5">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-green-600/20 bg-gradient-to-r from-green-600/10 to-transparent dark:from-green-600/15">
                <h2 id="reports-title" className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark">Relatório de Pagamentos e Pendências</h2>
              </div>
              <div className="p-4 sm:p-6">
                <p className="mb-4 text-sm text-rjb-text/80 dark:text-rjb-text-dark/80">
                  <strong className="text-green-600 dark:text-green-500">Valor mensal:</strong> R$ 20,00. Filtre por ano/mês e clique em Gerar.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input type="search" placeholder="Buscar por nome..." value={reportSearch} onChange={e => setReportSearch(e.target.value)} className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-green-500/40 focus:border-green-500 outline-none" />
                  </div>
                  <select value={reportYear} onChange={e => setReportYear(e.target.value)} className="min-h-[44px] sm:min-h-[42px] px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-green-500/40 outline-none">
                    <option value="">Todos os anos</option>
                    {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="min-h-[44px] sm:min-h-[42px] px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-green-500/40 outline-none">
                    <option value="">Todos os meses</option>
                    {MONTH_NAMES.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
                  </select>
                  <button type="button" onClick={fetchPaymentReport} className="min-h-[44px] sm:min-h-[42px] px-5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold shadow-lg shadow-green-600/20 transition-all touch-manipulation">Gerar Relatório</button>
                </div>
                <div className="mt-6"><PaymentReportTable report={filteredPaymentReport} /></div>
              </div>
            </div>
            <div className="rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-none border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-rjb-card-light dark:bg-rjb-card-dark ring-1 ring-black/5 dark:ring-white/5">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-green-600/20 bg-gradient-to-r from-green-600/10 to-transparent dark:from-green-600/15">
                <h2 className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark">Valor em Caixa</h2>
              </div>
              <div className="p-4 sm:p-6">
                <button type="button" onClick={fetchCashFlow} className="min-h-[44px] px-5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold shadow-lg shadow-green-600/20 transition-all touch-manipulation mb-6">Gerar Relatório de Caixa</button>
                <CashFlowReport data={cashFlow} />
              </div>
            </div>
          </section>
        )}
      </div>

      {modalContribution !== null && (
        <ContributionModal
          initial={modalContribution}
          members={members}
          onClose={() => setModalContribution(null)}
          onSave={saveContribution}
          canWrite={canWrite}
        />
      )}
      {modalDeposit !== null && (
        <DepositModal
          initial={modalDeposit}
          members={members}
          onClose={() => setModalDeposit(null)}
          onSave={saveDeposit}
          canWrite={canWrite}
        />
      )}
      {modalExpense !== null && (
        <ExpenseModal
          initial={modalExpense}
          onClose={() => setModalExpense(null)}
          onSave={saveExpense}
          canWrite={canWrite}
        />
      )}
    </PageWrapper>
  )
}

function ContributionsList ({ contributions, canWrite, onEdit, onDelete }) {
  const groups = groupByMonth(
    contributions,
    c => `${c.year}-${String(c.month).padStart(2, '0')}`,
    c => c.status === 'paid' ? c.amount : 0
  )
  const getMonthLabel = (key) => {
    const [y, m] = key.split('-')
    return `${MONTH_NAMES[parseInt(m, 10) - 1]}/${y}`
  }

  if (contributions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-sm sm:text-base">Nenhuma contribuição registrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(({ key, items, total }) => (
        <div key={key} className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-white/50 dark:bg-black/20">
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-green-600/15 to-green-600/5 dark:from-green-600/20 dark:to-green-600/10 border-b border-green-600/20 flex flex-wrap justify-between items-center gap-2">
            <h4 className="font-bold text-rjb-text dark:text-rjb-text-dark text-sm sm:text-base">{getMonthLabel(key)}</h4>
            <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">Total Pago: {formatMoney(total)}</span>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {items.map(c => (
              <div
                key={c.id}
                className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  c.status === 'paid'
                    ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200/80 dark:border-green-800/80'
                    : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/80 dark:border-amber-800/80'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-rjb-text dark:text-rjb-text-dark truncate">{c.memberName || 'Membro'}</p>
                  <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 tabular-nums">{formatMoney(c.amount)} {c.status === 'pending' && <span className="text-amber-600 dark:text-amber-400">(Pendente)</span>}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.receiptUrl && (
                    <a href={c.receiptUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors touch-manipulation">Ver Comprovante</a>
                  )}
                  {canWrite && (
                    <>
                      <button type="button" onClick={() => onEdit(c)} className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-manipulation">Editar</button>
                      <button type="button" onClick={() => onDelete(c.id)} className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation">Excluir</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByMonth (items, getKey, getAmount) {
  const by = {}
  items.forEach(item => {
    const key = getKey(item)
    if (!key) return
    if (!by[key]) by[key] = []
    by[key].push(item)
  })
  return Object.keys(by).sort().reverse().map(key => ({
    key,
    items: by[key],
    total: by[key].reduce((s, i) => s + (getAmount(i) || 0), 0),
  }))
}

function DepositsList ({ deposits, canWrite, onEdit, onDelete }) {
  const groups = groupByMonth(
    deposits,
    d => {
      if (!d.depositDate) return null
      const dt = new Date(d.depositDate)
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    },
    d => d.amount
  )
  const getMonthLabel = (key) => {
    const [y, m] = key.split('-')
    return `${MONTH_NAMES[parseInt(m, 10) - 1]}/${y}`
  }

  if (deposits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-sm sm:text-base">Nenhum depósito registrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(({ key, items, total }) => (
        <div key={key} className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-white/50 dark:bg-black/20">
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-green-600/15 to-green-600/5 border-b border-green-600/20 flex justify-between items-center">
            <h4 className="font-bold text-rjb-text dark:text-rjb-text-dark text-sm sm:text-base">{getMonthLabel(key)}</h4>
            <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">{formatMoney(total)}</span>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {items.map(d => (
              <div key={d.id} className="p-3 sm:p-4 rounded-xl border border-green-600/10 bg-rjb-bg-light/80 dark:bg-rjb-bg-dark/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-rjb-text dark:text-rjb-text-dark truncate">{d.memberName || 'Membro'}</p>
                  <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 tabular-nums">{d.depositDate ? new Date(d.depositDate).toLocaleDateString('pt-BR') : 'N/A'} · {formatMoney(d.amount)}</p>
                  {d.description && <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-1 line-clamp-2">{d.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.receiptUrl && (
                    <a href={d.receiptUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors touch-manipulation">Ver Comprovante</a>
                  )}
                  {canWrite && (
                    <>
                      <button type="button" onClick={() => onEdit(d)} className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg touch-manipulation">Editar</button>
                      <button type="button" onClick={() => onDelete(d.id)} className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg touch-manipulation">Excluir</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ExpensesList ({ expenses, canWrite, onEdit, onDelete }) {
  const groups = groupByMonth(
    expenses,
    e => {
      if (!e.expenseDate) return null
      const dt = new Date(e.expenseDate)
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    },
    e => e.amount
  )
  const getMonthLabel = (key) => {
    const [y, m] = key.split('-')
    return `${MONTH_NAMES[parseInt(m, 10) - 1]}/${y}`
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-sm sm:text-base">Nenhum gasto registrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(({ key, items, total }) => (
        <div key={key} className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-white/50 dark:bg-black/20">
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-red-600/15 to-red-600/5 border-b border-red-600/20 flex justify-between items-center">
            <h4 className="font-bold text-rjb-text dark:text-rjb-text-dark text-sm sm:text-base">{getMonthLabel(key)}</h4>
            <span className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">{formatMoney(total)}</span>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {items.map(e => (
              <div key={e.id} className="p-3 sm:p-4 rounded-xl border border-red-600/10 bg-rjb-bg-light/80 dark:bg-rjb-bg-dark/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-rjb-text dark:text-rjb-text-dark line-clamp-2">{e.description}</p>
                  <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 tabular-nums mt-0.5">{e.expenseDate ? new Date(e.expenseDate).toLocaleDateString('pt-BR') : 'N/A'} · {formatMoney(e.amount)}</p>
                  {e.category && <span className="inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-rjb-text/80 dark:text-rjb-text-dark/80">{e.category}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.receiptUrl && (
                    <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg touch-manipulation">Ver Comprovante</a>
                  )}
                  {canWrite && (
                    <>
                      <button type="button" onClick={() => onEdit(e)} className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg touch-manipulation">Editar</button>
                      <button type="button" onClick={() => onDelete(e.id)} className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-4 py-2.5 sm:py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg touch-manipulation">Excluir</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PaymentReportTable ({ report }) {
  if (!report || report.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-600">
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-sm sm:text-base">Clique em &quot;Gerar Relatório&quot; para visualizar os dados.</p>
      </div>
    )
  }
  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-700/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-rjb-text dark:text-rjb-text-dark">Membro</th>
              <th className="text-left py-3 px-4 font-semibold text-rjb-text dark:text-rjb-text-dark">Último mês pago</th>
              <th className="text-right py-3 px-4 font-semibold text-rjb-text dark:text-rjb-text-dark">Total pago</th>
              <th className="text-right py-3 px-4 font-semibold text-rjb-text dark:text-rjb-text-dark">Pendente</th>
              <th className="text-right py-3 px-4 font-semibold text-rjb-text dark:text-rjb-text-dark">Meses pend.</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r, i) => (
              <tr key={r.memberId || i} className="border-b border-gray-100 dark:border-gray-700/80 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-rjb-text dark:text-rjb-text-dark font-medium">{r.memberName || '—'}</td>
                <td className="py-3 px-4 text-rjb-text/80 dark:text-rjb-text-dark/80">{r.lastPaidMonth || 'Nunca'}</td>
                <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-medium tabular-nums">{formatMoney(r.totalPaid)}</td>
                <td className="py-3 px-4 text-right text-red-600 dark:text-red-400 font-medium tabular-nums">{formatMoney(r.totalPending)}</td>
                <td className="py-3 px-4 text-right tabular-nums">{r.pendingMonths ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {report.map((r, i) => (
          <div key={r.memberId || i} className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-rjb-card-light dark:bg-rjb-card-dark">
            <p className="font-semibold text-rjb-text dark:text-rjb-text-dark truncate">{r.memberName || '—'}</p>
            <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-0.5">Último pago: {r.lastPaidMonth || 'Nunca'}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium tabular-nums">{formatMoney(r.totalPaid)}</span>
              <span className="text-red-600 dark:text-red-400 font-medium tabular-nums">Pend. {formatMoney(r.totalPending)}</span>
              <span className="text-rjb-text/70 dark:text-rjb-text-dark/70">{r.pendingMonths ?? 0} meses pend.</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function CashFlowReport ({ data }) {
  if (!data || !data.summary) {
    return (
      <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-600">
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-sm sm:text-base">Clique em &quot;Gerar Relatório de Caixa&quot; para visualizar.</p>
      </div>
    )
  }
  const { totalContributions, totalDeposits, totalExpenses, cashFlow } = data.summary
  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-green-800/10 border border-green-200/80 dark:border-green-800/50">
        <h4 className="text-base sm:text-lg font-bold text-green-800 dark:text-green-200 mb-4">Resumo Financeiro</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-green-200/80 dark:border-green-800/50 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Contribuições</p>
            <p className="text-lg sm:text-xl font-bold tabular-nums text-green-600 dark:text-green-400">{formatMoney(totalContributions)}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-green-200/80 dark:border-green-800/50 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Depósitos</p>
            <p className="text-lg sm:text-xl font-bold tabular-nums text-green-600 dark:text-green-400">{formatMoney(totalDeposits)}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-red-200/80 dark:border-red-800/50 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Gastos</p>
            <p className="text-lg sm:text-xl font-bold tabular-nums text-red-600 dark:text-red-400">{formatMoney(totalExpenses)}</p>
          </div>
          <div className={`col-span-2 lg:col-span-1 p-4 rounded-xl bg-white/90 dark:bg-gray-800/90 border-2 shadow-sm ${cashFlow >= 0 ? 'border-green-500 dark:border-green-600' : 'border-red-500 dark:border-red-600'}`}>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Valor em Caixa</p>
            <p className={`text-lg sm:text-xl font-bold tabular-nums ${cashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatMoney(cashFlow)}</p>
          </div>
        </div>
        <p className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 text-xs sm:text-sm text-rjb-text/90 dark:text-rjb-text-dark/90">
          Contribuições + Depósitos − Gastos = <strong className="tabular-nums">{formatMoney(cashFlow)}</strong>
        </p>
      </div>
      {data.details && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-green-600/20">
            <h5 className="font-bold text-green-600 mb-3">Contribuições ({data.details.contributions?.length || 0})</h5>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(data.details.contributions || []).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma</p>
              ) : (
                data.details.contributions.map(c => (
                  <div key={c.id} className="text-sm p-2 bg-white dark:bg-gray-800 rounded border">
                    <p className="font-semibold">{c.memberName || 'Membro'}</p>
                    <p className="text-gray-600 dark:text-gray-400">{c.month}/{c.year} - {formatMoney(c.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-xl border border-green-600/20 dark:border-green-700/50 bg-white/50 dark:bg-black/20">
            <h5 className="font-bold text-green-600 dark:text-green-500 mb-3 text-sm sm:text-base">Depósitos ({data.details.deposits?.length || 0})</h5>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(data.details.deposits || []).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum</p>
              ) : (
                data.details.deposits.map(d => (
                  <div key={d.id} className="text-sm p-2 bg-white dark:bg-gray-800 rounded border">
                    <p className="font-semibold">{d.memberName || 'Membro'}</p>
                    <p className="text-gray-600 dark:text-gray-400">{d.depositDate ? new Date(d.depositDate).toLocaleDateString('pt-BR') : 'N/A'} - {formatMoney(d.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-xl border border-red-600/20 dark:border-red-700/50 bg-white/50 dark:bg-black/20">
            <h5 className="font-bold text-red-600 dark:text-red-500 mb-3 text-sm sm:text-base">Gastos ({data.details.expenses?.length || 0})</h5>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(data.details.expenses || []).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum</p>
              ) : (
                data.details.expenses.map(e => (
                  <div key={e.id} className="text-sm p-2 bg-white dark:bg-gray-800 rounded border">
                    <p className="font-semibold">{e.description}</p>
                    <p className="text-gray-600 dark:text-gray-400">{e.expenseDate ? new Date(e.expenseDate).toLocaleDateString('pt-BR') : 'N/A'} - {formatMoney(e.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ContributionModal ({ initial, members, onClose, onSave, canWrite }) {
  const isEdit = !!initial?.id
  const [memberId, setMemberId] = useState(initial.memberId || '')
  const [memberName, setMemberName] = useState(initial.memberName || '')
  const [month, setMonth] = useState(initial.month || new Date().getMonth() + 1)
  const [year, setYear] = useState(initial.year || new Date().getFullYear())
  const [amount, setAmount] = useState(initial.amount ?? MONTHLY_CONTRIBUTION)
  const [status, setStatus] = useState(initial.status || 'pending')
  const [receiptFile, setReceiptFile] = useState(null)

  const member = members.find(m => m.id === memberId)
  const displayName = member ? member.name : memberName

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: initial.id,
      memberId,
      memberName: displayName || memberName,
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      amount: parseFloat(amount),
      status,
      receiptUrl: initial.receiptUrl,
    }, receiptFile || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden bg-black/50 sm:bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="contribution-modal-title">
      <div className="bg-rjb-card-light dark:bg-rjb-card-dark w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 sticky top-0 bg-rjb-card-light dark:bg-rjb-card-dark border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <h3 id="contribution-modal-title" className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-500">{(isEdit ? 'Editar' : 'Nova')} Contribuição</h3>
          <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 -mr-2 touch-manipulation" aria-label="Fechar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Membro</label>
            <select
              value={memberId}
              onChange={e => { setMemberId(e.target.value); const m = members.find(x => x.id === e.target.value); if (m) setMemberName(m.name) }}
              required
              className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
            >
              <option value="">Selecione um membro</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mês</label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ano</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} required min={2020} max={2100} className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" min={0} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark">
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comprovante (opcional)</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
            {initial.receiptUrl && !receiptFile && <a href={initial.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm mt-1 inline-block">Ver comprovante atual</a>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] sm:min-h-[44px] py-3 sm:py-2 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 touch-manipulation">Cancelar</button>
            <button type="submit" className="flex-1 min-h-[48px] sm:min-h-[44px] py-3 sm:py-2 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold touch-manipulation">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DepositModal ({ initial, members, onClose, onSave, canWrite }) {
  const isEdit = !!initial?.id
  const [memberId, setMemberId] = useState(initial.memberId || '')
  const [memberName, setMemberName] = useState(initial.memberName || '')
  const [depositDate, setDepositDate] = useState(initial.depositDate ? (typeof initial.depositDate === 'string' ? initial.depositDate.slice(0, 10) : new Date(initial.depositDate).toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState(initial.amount ?? '')
  const [description, setDescription] = useState(initial.description || '')
  const [receiptFile, setReceiptFile] = useState(null)

  const member = members.find(m => m.id === memberId)
  const displayName = member ? member.name : memberName

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: initial.id,
      memberId,
      memberName: displayName || memberName,
      depositDate,
      amount: parseFloat(amount),
      description,
      receiptUrl: initial.receiptUrl,
    }, receiptFile || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="deposit-modal-title">
      <div className="bg-rjb-card-light dark:bg-rjb-card-dark w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 sticky top-0 bg-rjb-card-light dark:bg-rjb-card-dark border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <h3 id="deposit-modal-title" className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-500">{(isEdit ? 'Editar' : 'Novo')} Depósito</h3>
          <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 -mr-2 touch-manipulation" aria-label="Fechar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Membro</label>
            <select value={memberId} onChange={e => { setMemberId(e.target.value); const m = members.find(x => x.id === e.target.value); if (m) setMemberName(m.name) }} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark">
              <option value="">Selecione um membro</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data do Depósito</label>
            <input type="date" value={depositDate} onChange={e => setDepositDate(e.target.value)} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" min={0} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comprovante</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
            {initial.receiptUrl && !receiptFile && <a href={initial.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm mt-1 inline-block">Ver comprovante atual</a>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] sm:min-h-[44px] py-3 sm:py-2 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 touch-manipulation">Cancelar</button>
            <button type="submit" className="flex-1 min-h-[48px] sm:min-h-[44px] py-3 sm:py-2 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold touch-manipulation">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExpenseModal ({ initial, onClose, onSave, canWrite }) {
  const isEdit = !!initial?.id
  const [description, setDescription] = useState(initial.description || '')
  const [amount, setAmount] = useState(initial.amount ?? '')
  const [expenseDate, setExpenseDate] = useState(initial.expenseDate ? (typeof initial.expenseDate === 'string' ? initial.expenseDate.slice(0, 10) : new Date(initial.expenseDate).toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(initial.category || 'outros')
  const [receiptFile, setReceiptFile] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: initial.id,
      description,
      amount: parseFloat(amount),
      expenseDate,
      category,
      receiptUrl: initial.receiptUrl,
    }, receiptFile || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div className="bg-rjb-card-light dark:bg-rjb-card-dark w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 sticky top-0 bg-rjb-card-light dark:bg-rjb-card-dark border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <h3 id="expense-modal-title" className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-500">{(isEdit ? 'Editar' : 'Novo')} Gasto</h3>
          <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 -mr-2 touch-manipulation" aria-label="Fechar">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" min={0} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark">
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comprovante (opcional)</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="w-full p-3 rounded-lg border border-green-600/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark" />
            {initial.receiptUrl && !receiptFile && <a href={initial.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm mt-1 inline-block">Ver comprovante atual</a>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] sm:min-h-[44px] py-3 sm:py-2 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 touch-manipulation">Cancelar</button>
            <button type="submit" className="flex-1 min-h-[48px] sm:min-h-[44px] py-3 sm:py-2 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold touch-manipulation">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Financeiro
