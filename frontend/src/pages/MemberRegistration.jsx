import { useState, useEffect } from 'react'
import PageWrapper from '../components/PageWrapper'
import { showMessage } from '../components/MessageBox'
import { showLoader } from '../components/LoadingOverlay'
import api from '../services/api'

const MemberRegistration = () => {
  const [formData, setFormData] = useState({
    inviteKey: '',
    name: '',
    tefa: '',
    instrument: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    termsAccepted: false
  })
  const [cities, setCities] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const termsVersion = 'Termo de Consentimento v1.0 - Ciclo 2026'

  const normalizeName = (name) => {
    if (!name) return ''
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim()
  }

  const fetchCities = async (uf) => {
    if (!uf) {
      setCities([])
      setFormData({ ...formData, city: '' })
      return
    }

    setLoadingCities(true)
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      const data = await response.json()
      setCities(data)
    } catch (error) {
      showMessage('Erro ao carregar lista de cidades.', true)
    } finally {
      setLoadingCities(false)
    }
  }

  useEffect(() => {
    if (formData.state) {
      fetchCities(formData.state)
    }
  }, [formData.state])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedName = normalizeName(formData.name)
    const finalFormData = { ...formData, name: normalizedName }

    if (!finalFormData.inviteKey || !finalFormData.name || !finalFormData.instrument || 
        !finalFormData.email || !finalFormData.city || !finalFormData.state || !finalFormData.phone) {
      showMessage('Por favor, preencha todos os campos obrigatórios.', true)
      return
    }

    if (finalFormData.tefa && !/^\d+$/.test(finalFormData.tefa)) {
      showMessage('O campo TEFA deve conter apenas números.', true)
      return
    }

    if (!finalFormData.termsAccepted) {
      showMessage('Você deve aceitar os termos LGPD para continuar.', true)
      return
    }

    showLoader(true, 'Enviando sua inscrição...')

    try {
      const response = await api.post('/api/register-member', {
        ...finalFormData,
        termsVersion
      })

      if (response.data.status === 200) {
        showMessage(response.data.message || 'Inscrição concluída!')
        setFormData({
          inviteKey: '',
          name: '',
          tefa: '',
          instrument: '',
          email: '',
          phone: '',
          city: '',
          state: '',
          termsAccepted: false
        })
        setCities([])
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Erro no cadastro.', true)
    } finally {
      showLoader(false)
    }
  }

  const estados = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
  ]

  return (
    <PageWrapper title="Cadastro de Membros">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <div>
          <label htmlFor="reg-invite-key" className="block text-sm font-medium opacity-70 mb-1 flex items-center gap-1">
            Chave de Convite <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="reg-invite-key"
            required
            value={formData.inviteKey}
            onChange={(e) => setFormData({ ...formData, inviteKey: e.target.value.toUpperCase() })}
            className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
            placeholder="Ex: RJB-MEMBER-2025"
          />
        </div>

        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium opacity-70 mb-1 flex items-center gap-1">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="reg-name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={(e) => setFormData({ ...formData, name: normalizeName(e.target.value) })}
            className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
          />
        </div>

        <div>
          <label htmlFor="reg-tefa" className="block text-sm font-medium opacity-70 mb-1">
            TEFA (opcional)
          </label>
          <input
            type="text"
            id="reg-tefa"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.tefa}
            onChange={(e) => setFormData({ ...formData, tefa: e.target.value })}
            className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
          />
        </div>

        <div>
          <label htmlFor="reg-instrument" className="block text-sm font-medium opacity-70 mb-1 flex items-center gap-1">
            Instrumento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="reg-instrument"
            required
            value={formData.instrument}
            onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
            className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium opacity-70 mb-1 flex items-center gap-1">
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="reg-email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
          />
        </div>

        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium opacity-70 mb-1 flex items-center gap-1">
            Telefone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="reg-phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-state" className="block text-sm font-medium opacity-70 mb-1 flex items-center gap-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              id="reg-state"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
              className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark"
            >
              <option value="">Selecione o Estado</option>
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reg-city" className="block text-sm font-medium opacity-70 mb-1 flex items-center gap-1">
              Cidade <span className="text-red-500">*</span>
            </label>
            <select
              id="reg-city"
              required
              disabled={!formData.state || loadingCities}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-3 rounded-lg border border-rjb-yellow/30 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark disabled:opacity-50"
            >
              <option value="">
                {loadingCities ? 'Carregando cidades...' : formData.state ? 'Selecione a Cidade' : 'Selecione o Estado primeiro'}
              </option>
              {cities.map(city => (
                <option key={city.id} value={city.nome}>{city.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            checked={formData.termsAccepted}
            onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
            className="mt-1 mr-2"
          />
          <label htmlFor="terms" className="text-sm">
            Aceito os termos de consentimento LGPD <span className="text-red-500">*</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-rjb-yellow text-rjb-text font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition"
        >
          Enviar Inscrição
        </button>
      </form>
    </PageWrapper>
  )
}

export default MemberRegistration
