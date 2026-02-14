import { useState, useEffect } from 'react'
import { showMessage } from '../MessageBox'
import { showLoader } from '../LoadingOverlay'
import api from '../../services/api'

const EditMemberModal = ({ member, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    tefa: '',
    phone: '',
    instrument: '',
    city: '',
    state: ''
  })

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        tefa: member.tefa || '',
        phone: member.phone || '',
        instrument: member.instrument || '',
        city: member.city || '',
        state: member.state || ''
      })
    }
  }, [member])

  const normalizeName = (name) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const normalizedName = normalizeName(formData.name.trim())
    const updatedData = {
      name: normalizedName,
      tefa: formData.tefa,
      phone: formData.phone,
      instrument: formData.instrument,
      city: formData.city,
      state: formData.state.toUpperCase()
    }

    showLoader(true, 'Salvando alterações...')

    try {
      await api.put(`/api/admin/update-member/${member.id}`, updatedData)
      showMessage('Cadastro atualizado com sucesso!')
      onSuccess()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro ao atualizar dados.', true)
    } finally {
      showLoader(false)
    }
  }

  const handleChange = (field, value) => {
    if (field === 'tefa') {
      value = value.replace(/[^0-9]/g, '')
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!member) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-80 z-[90] flex items-center justify-center transition-opacity duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-auto p-6 bg-rjb-card-light dark:bg-rjb-card-dark rounded-xl shadow-soft-glow border border-rjb-yellow/30 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rjb-text/50 dark:text-rjb-text-dark/50 hover:text-rjb-yellow transition-colors text-2xl"
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold text-rjb-yellow mb-6">Editar Membro</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Nome Completo</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={(e) => {
                const normalized = normalizeName(e.target.value)
                setFormData(prev => ({ ...prev, name: normalized }))
              }}
              className="w-full p-3 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">TEFA</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.tefa}
                onChange={(e) => handleChange('tefa', e.target.value)}
                className="w-full p-3 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Telefone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full p-3 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Instrumento / Área</label>
            <input
              type="text"
              required
              value={formData.instrument}
              onChange={(e) => handleChange('instrument', e.target.value)}
              className="w-full p-3 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Cidade</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full p-3 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Estado (UF)</label>
              <input
                type="text"
                required
                maxLength="2"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                className="w-full p-3 rounded-lg bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/20 text-rjb-text dark:text-rjb-text-dark outline-none focus:ring-2 focus:ring-rjb-yellow transition-all"
              />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-rjb-yellow/50 font-bold hover:bg-rjb-yellow/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg bg-rjb-yellow text-rjb-text font-bold hover:bg-yellow-500 shadow-subtle-glow transition-all"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMemberModal
