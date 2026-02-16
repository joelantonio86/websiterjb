import { useState, useEffect, useRef } from 'react'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import api from '../../services/api'
import EditMemberModal from './EditMemberModal'
import DeleteMemberModal from './DeleteMemberModal'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const MEMBERS_PER_PAGE = 20

const MembersReport = () => {
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({ name: '', instrument: '', location: '' })
  const [sortColumn, setSortColumn] = useState('name')
  const [sortDirection, setSortDirection] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [members, filters, sortColumn, sortDirection])

  const fetchMembers = async () => {
    showLoader(true, 'Carregando membros...')
    try {
      const response = await api.get('/api/reports/members')
      const allMembers = response.data.allMembers || []
      setMembers(allMembers)
      setFilteredMembers(allMembers)
    } catch (error) {
      showMessage('Erro ao carregar membros.', true)
    } finally {
      showLoader(false)
    }
  }

  const normalizeText = (text) => {
    return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  const applyFiltersAndSort = () => {
    let filtered = [...members]

    // Aplicar filtros
    if (filters.name) {
      const searchName = normalizeText(filters.name)
      filtered = filtered.filter(m => normalizeText(m.name).includes(searchName))
    }
    if (filters.instrument) {
      filtered = filtered.filter(m => normalizeText(m.instrument) === normalizeText(filters.instrument))
    }
    if (filters.location) {
      filtered = filtered.filter(m => `${m.city || ''}/${m.state || ''}`.trim() === filters.location)
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aVal, bVal
      if (sortColumn === 'name') {
        aVal = normalizeText(a.name)
        bVal = normalizeText(b.name)
      } else if (sortColumn === 'instrument') {
        aVal = normalizeText(a.instrument)
        bVal = normalizeText(b.instrument)
      } else if (sortColumn === 'location') {
        aVal = `${a.city || ''}/${a.state || ''}`.trim()
        bVal = `${b.city || ''}/${b.state || ''}`.trim()
      } else {
        return 0
      }
      const comparison = aVal.localeCompare(bVal)
      return sortDirection ? comparison : -comparison
    })

    setFilteredMembers(filtered)
    setCurrentPage(1)
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(!sortDirection)
    } else {
      setSortColumn(column)
      setSortDirection(true)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ name: '', instrument: '', location: '' })
    setSortColumn('name')
    setSortDirection(true)
  }

  const getUniqueInstruments = () => {
    const instruments = new Set()
    members.forEach(m => {
      if (m.instrument && m.instrument.trim()) {
        instruments.add(m.instrument.trim())
      }
    })
    return Array.from(instruments).sort()
  }

  const getUniqueLocations = () => {
    const locations = new Set()
    members.forEach(m => {
      const location = `${m.city || ''}/${m.state || ''}`.trim()
      if (location && location !== '/') {
        locations.add(location)
      }
    })
    return Array.from(locations).sort()
  }

  const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE)
  const startIndex = (currentPage - 1) * MEMBERS_PER_PAGE
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + MEMBERS_PER_PAGE)

  const handleEdit = (member) => {
    setEditModal(member)
  }

  const handleDelete = (member) => {
    setDeleteModal(member)
  }

  const handleEditSuccess = () => {
    setEditModal(null)
    fetchMembers()
  }

  const handleDeleteSuccess = () => {
    setDeleteModal(null)
    fetchMembers()
  }

  const handleDownloadCSV = () => {
    const headers = ['Nome', 'Instrumento', 'TEFA', 'Cidade', 'Estado', 'Telefone']
    const rows = filteredMembers.map(m => [
      m.name || '',
      m.instrument || '',
      m.tefa || '',
      m.city || '',
      m.state || '',
      m.phone || ''
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `membros-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    showMessage('CSV exportado com sucesso!')
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório de Membros - RJB', 14, 15)
    doc.setFontSize(10)
    doc.text(`Total: ${filteredMembers.length} membros`, 14, 22)
    
    const tableData = filteredMembers.map(m => [
      m.name || '',
      m.instrument || '',
      m.tefa || '---',
      `${m.city || ''}/${m.state || ''}`,
      m.phone || '---'
    ])

    doc.autoTable({
      head: [['Nome', 'Instrumento', 'TEFA', 'Localidade', 'Telefone']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 193, 7] }
    })

    doc.save(`membros-${new Date().toISOString().split('T')[0]}.pdf`)
    showMessage('PDF exportado com sucesso!')
  }

  const normalizeAllNames = async () => {
    if (!confirm('Esta ação irá normalizar todos os nomes em caixa alta para o formato padrão (Primeira Letra Maiúscula).\n\nDeseja continuar?')) {
      return
    }

    showLoader(true, 'Normalizando nomes...')
    try {
      const membersToUpdate = members.filter(m => {
        if (!m.name) return false
        const normalized = normalizeName(m.name)
        return normalized !== m.name && normalized.length > 0
      })

      if (membersToUpdate.length === 0) {
        showMessage('Todos os nomes já estão normalizados!')
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const member of membersToUpdate) {
        try {
          const normalizedName = normalizeName(member.name)
          await api.put(`/api/admin/update-member/${member.id}`, {
            name: normalizedName,
            tefa: member.tefa || '',
            phone: member.phone || '',
            instrument: member.instrument || '',
            city: member.city || '',
            state: member.state || ''
          })
          successCount++
        } catch (error) {
          errorCount++
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      showMessage(`${successCount} nome(s) normalizado(s) com sucesso!${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`, errorCount > 0)
      fetchMembers()
    } catch (error) {
      showMessage('Erro ao normalizar nomes.', true)
    } finally {
      showLoader(false)
    }
  }

  const normalizeName = (name) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <>
      <div className="bg-gradient-to-br from-rjb-card-light to-rjb-bg-light dark:from-rjb-card-dark dark:to-rjb-bg-dark/50 rounded-2xl shadow-xl border-2 border-rjb-yellow/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:via-rjb-yellow/5 dark:to-rjb-yellow/5 px-5 sm:px-6 py-4 border-b border-rjb-yellow/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rjb-yellow/30 to-rjb-yellow/20 dark:from-rjb-yellow/20 dark:to-rjb-yellow/10 shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-rjb-text dark:text-rjb-text-dark">Gerenciamento de Membros</h3>
                <p className="text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mt-0.5">Visualize, edite e gerencie membros cadastrados</p>
              </div>
            </div>
            <button
              onClick={normalizeAllNames}
              className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Normalizar Nomes
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          {/* Header com filtros */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/90 dark:to-rjb-yellow/5 p-6 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-gray-200/50 dark:border-rjb-yellow/10 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-rjb-yellow to-rjb-yellow/80 flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-rjb-text dark:text-rjb-text-dark uppercase tracking-tight mb-1 truncate">Membros Cadastrados</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-rjb-yellow/20 to-rjb-yellow/10 text-rjb-yellow border border-rjb-yellow/30">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span className="whitespace-nowrap">Total: {filteredMembers.length}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                  <div className="relative flex-grow w-full sm:min-w-[200px] lg:min-w-[250px]">
                    <span className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Buscar por nome..."
                      value={filters.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                      className="pl-10 sm:pl-12 pr-3 sm:pr-4 w-full py-2.5 sm:py-3 text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-rjb-bg-dark/50 focus:border-rjb-yellow focus:ring-2 sm:focus:ring-4 focus:ring-rjb-yellow/20 outline-none transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                  <div className="relative flex-grow w-full sm:min-w-[150px]">
                    <span className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                    </span>
                    <select
                      value={filters.instrument}
                      onChange={(e) => handleFilterChange('instrument', e.target.value)}
                      className={`pl-10 sm:pl-12 pr-8 sm:pr-10 w-full py-2.5 sm:py-3 text-sm rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-rjb-bg-dark/50 focus:border-rjb-yellow focus:ring-2 sm:focus:ring-4 focus:ring-rjb-yellow/20 outline-none transition-all shadow-sm hover:shadow-md appearance-none bg-white dark:bg-rjb-bg-dark/50 cursor-pointer ${!filters.instrument ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                      <option value="">Filtrar por instrumento...</option>
                      {getUniqueInstruments().map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-grow w-full sm:min-w-[150px]">
                    <span className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </span>
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className={`pl-10 sm:pl-12 pr-8 sm:pr-10 w-full py-2.5 sm:py-3 text-sm rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-rjb-bg-dark/50 focus:border-rjb-yellow focus:ring-2 sm:focus:ring-4 focus:ring-rjb-yellow/20 outline-none transition-all shadow-sm hover:shadow-md appearance-none bg-white dark:bg-rjb-bg-dark/50 cursor-pointer ${!filters.location ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                      <option value="">Filtrar por localidade...</option>
                      {getUniqueLocations().map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDownloadCSV}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-sm font-medium flex-1 sm:flex-none sm:min-w-[100px]"
                title="Exportar CSV"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
                <span>CSV</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-sm font-medium flex-1 sm:flex-none sm:min-w-[100px]"
                title="Exportar PDF"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>PDF</span>
              </button>
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 text-sm font-medium flex-1 sm:flex-none sm:min-w-[100px]"
                title="Limpar Filtros"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Limpar</span>
              </button>
            </div>
          </div>

          {/* Versão Mobile: Cards */}
          <div className="lg:hidden space-y-3">
            {paginatedMembers.length === 0 ? (
              <p className="text-center text-rjb-text/70 dark:text-rjb-text-dark/70 py-8">Nenhum membro encontrado.</p>
            ) : (
              paginatedMembers.map((m, index) => {
                const sequenceNumber = startIndex + index + 1
                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-rjb-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    <div className="mb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-rjb-yellow/30 to-rjb-yellow/20 text-rjb-yellow font-bold text-sm border-2 border-rjb-yellow/40 shadow-sm">
                            {sequenceNumber}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <h3 className="font-bold text-rjb-text dark:text-rjb-text-dark text-lg leading-tight break-words mb-2">
                            {m.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                            </svg>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium break-words">{m.instrument}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center bg-gradient-to-br from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:text-rjb-yellow text-xs font-bold px-3 py-1.5 rounded-full border border-rjb-yellow/30" style={{ color: '#8B6914' }}>
                          TEFA: {m.tefa || '---'}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium break-words flex-1">{m.city || ''}/{m.state || ''}</span>
                      </div>
                      
                      {m.phone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/55${(m.phone || '').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors text-sm font-medium"
                          >
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span className="break-all">{m.phone}</span>
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleEdit(m)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all shadow-sm flex-shrink-0"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all shadow-sm flex-shrink-0"
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Versão Desktop: Tabela */}
          <div className="hidden lg:block rounded-xl border border-gray-200/50 dark:border-rjb-yellow/10 shadow-xl bg-white dark:bg-rjb-card-dark backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-br from-amber-300 via-amber-300/95 to-amber-300/90 text-rjb-text dark:text-rjb-text-dark text-xs uppercase font-black tracking-wider shadow-lg relative">
                  <th className="p-3 px-4 text-center rounded-tl-xl relative whitespace-nowrap" style={{ width: '60px' }}>
                    <div className="flex items-center justify-center">
                      <span className="text-white drop-shadow-sm text-xs">Nº</span>
                    </div>
                  </th>
                  <th
                    className="p-3 px-4 cursor-pointer group relative transition-all duration-300 hover:bg-rjb-yellow/20 hover:shadow-inner"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white drop-shadow-sm text-xs">Membro</span>
                      <div className="flex flex-col items-center justify-center">
                        {sortColumn === 'name' ? (
                          <svg className={`w-3 h-3 text-white ${sortDirection ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                  </th>
                  <th
                    className="p-3 px-4 cursor-pointer group relative transition-all duration-300 hover:bg-rjb-yellow/20 hover:shadow-inner"
                    onClick={() => handleSort('instrument')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white drop-shadow-sm text-xs">Instrumento</span>
                      <div className="flex flex-col items-center justify-center">
                        {sortColumn === 'instrument' ? (
                          <svg className={`w-3 h-3 text-white ${sortDirection ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="p-3 px-4 relative whitespace-nowrap" style={{ width: '90px' }}>
                    <div className="flex items-center">
                      <span className="text-white drop-shadow-sm text-xs">TEFA</span>
                    </div>
                  </th>
                  <th
                    className="p-3 px-4 cursor-pointer group relative transition-all duration-300 hover:bg-rjb-yellow/20 hover:shadow-inner"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white drop-shadow-sm text-xs">Localidade</span>
                      <div className="flex flex-col items-center justify-center">
                        {sortColumn === 'location' ? (
                          <svg className={`w-3 h-3 text-white ${sortDirection ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="p-3 px-4 relative">
                    <div className="flex items-center">
                      <span className="text-white drop-shadow-sm text-xs">WhatsApp</span>
                    </div>
                  </th>
                  <th className="p-3 pr-4 text-right rounded-tr-xl relative" style={{ width: '70px' }}>
                    <div className="flex items-center justify-end">
                      <span className="text-white drop-shadow-sm text-xs">Gerenciar</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-rjb-text dark:text-rjb-text-dark/80 divide-y divide-gray-100 dark:divide-gray-700/50">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-rjb-text/70 dark:text-rjb-text-dark/70">
                      Nenhum membro encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((m, index) => {
                    const sequenceNumber = startIndex + index + 1
                    const phoneMatch = m.phone?.match(/\((\d+)\)\s*(.+)/)
                    const areaCode = phoneMatch ? phoneMatch[1] : ''
                    const phoneNumber = phoneMatch ? phoneMatch[2] : m.phone?.replace(/\([^)]*\)\s*/, '') || ''
                    
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-rjb-yellow/5 hover:to-transparent transition-all duration-300 group"
                      >
                        <td className="p-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-rjb-yellow/30 to-rjb-yellow/20 text-rjb-yellow font-bold text-sm border-2 border-rjb-yellow/40 shadow-sm">
                            {sequenceNumber}
                          </span>
                        </td>
                        <td className="p-3 px-4">
                          <span className="font-semibold text-rjb-text dark:text-rjb-text-dark text-sm leading-relaxed break-words" style={{ wordBreak: 'break-word', lineHeight: '1.5' }}>
                            {m.name}
                          </span>
                        </td>
                        <td className="p-3 px-4">
                          <div className="flex items-start gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed break-words" style={{ wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxHeight: '3em' }}>
                              {m.instrument}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 px-4">
                          <span className="inline-flex items-center justify-center bg-gradient-to-br from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:text-rjb-yellow text-xs font-bold px-2.5 py-1 rounded-full border border-rjb-yellow/30 shadow-sm" style={{ color: '#8B6914' }}>
                            {m.tefa || '---'}
                          </span>
                        </td>
                        <td className="p-3 px-4">
                          <div className="flex items-start gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words" style={{ wordBreak: 'break-word', lineHeight: '1.5' }}>
                              {m.city || ''}/{m.state || ''}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 px-4">
                          {m.phone ? (
                            <a
                              href={`https://wa.me/55${(m.phone || '').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block font-mono text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                <span className="hover:underline">{areaCode ? `(${areaCode})` : ''}</span>
                              </div>
                              <div className="pl-5">
                                <span className="hover:underline">{phoneNumber}</span>
                              </div>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">---</span>
                          )}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex flex-col items-end gap-1 opacity-100">
                            <button
                              onClick={() => handleEdit(m)}
                              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all shadow-sm flex-shrink-0"
                              title="Editar"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(m)}
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition-all shadow-sm flex-shrink-0"
                              title="Excluir"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-rjb-yellow/20">
              <div className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
                Mostrando <span className="font-semibold">{startIndex + 1}</span> a <span className="font-semibold">{Math.min(startIndex + MEMBERS_PER_PAGE, filteredMembers.length)}</span> de <span className="font-semibold">{filteredMembers.length}</span> membros
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-rjb-text dark:text-rjb-text-dark bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 rounded-lg hover:bg-rjb-yellow/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          pageNum === currentPage
                            ? 'text-white bg-rjb-yellow border border-rjb-yellow'
                            : 'text-rjb-text dark:text-rjb-text-dark bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 hover:bg-rjb-yellow/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-rjb-text dark:text-rjb-text-dark bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 rounded-lg hover:bg-rjb-yellow/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editModal && (
        <EditMemberModal
          member={editModal}
          onClose={() => setEditModal(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deleteModal && (
        <DeleteMemberModal
          member={deleteModal}
          onClose={() => setDeleteModal(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  )
}

export default MembersReport
