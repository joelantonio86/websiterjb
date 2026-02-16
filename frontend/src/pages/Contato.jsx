import { useState, useEffect } from 'react'
import PageWrapper from '../components/PageWrapper'
import { showMessage } from '../components/MessageBox'
import { showLoader } from '../components/LoadingOverlay'
import api from '../services/api'

const Contato = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    senderName: '',
    senderEmail: '',
    subject: '',
    body: ''
  })
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    showLoader(true, 'Enviando mensagem...')

    try {
      await api.post('/', formData)
      showMessage('Mensagem enviada com sucesso!')
      setFormData({ senderName: '', senderEmail: '', subject: '', body: '' })
    } catch (error) {
      showMessage('Erro ao enviar mensagem. Tente novamente.', true)
    } finally {
      showLoader(false)
    }
  }

  return (
    <PageWrapper title="Fale Conosco">
      <div className={`max-w-2xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-base sm:text-lg md:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 px-2">
            Entre em contato conosco. Estamos sempre abertos para conversar sobre música, cultura e parcerias.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="senderName" className="block text-xs sm:text-sm font-semibold text-rjb-text dark:text-rjb-text-dark flex items-center gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Nome
            </label>
            <input
              id="senderName"
              type="text"
              required
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              onFocus={() => setFocusedField('senderName')}
              onBlur={() => setFocusedField(null)}
              className={`w-full p-3 sm:p-4 text-base rounded-lg sm:rounded-xl border-2 transition-all duration-300 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark ${
                focusedField === 'senderName'
                  ? 'border-rjb-yellow ring-2 sm:ring-4 ring-rjb-yellow/20'
                  : 'border-rjb-yellow/30 hover:border-rjb-yellow/50'
              }`}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="senderEmail" className="block text-xs sm:text-sm font-semibold text-rjb-text dark:text-rjb-text-dark flex items-center gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
              </svg>
              E-mail
            </label>
            <input
              id="senderEmail"
              type="email"
              required
              value={formData.senderEmail}
              onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
              onFocus={() => setFocusedField('senderEmail')}
              onBlur={() => setFocusedField(null)}
              className={`w-full p-3 sm:p-4 text-base rounded-lg sm:rounded-xl border-2 transition-all duration-300 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark ${
                focusedField === 'senderEmail'
                  ? 'border-rjb-yellow ring-2 sm:ring-4 ring-rjb-yellow/20'
                  : 'border-rjb-yellow/30 hover:border-rjb-yellow/50'
              }`}
              placeholder="seu.email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="block text-xs sm:text-sm font-semibold text-rjb-text dark:text-rjb-text-dark flex items-center gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
              </svg>
              Assunto
            </label>
            <input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              onFocus={() => setFocusedField('subject')}
              onBlur={() => setFocusedField(null)}
              className={`w-full p-3 sm:p-4 text-base rounded-lg sm:rounded-xl border-2 transition-all duration-300 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark ${
                focusedField === 'subject'
                  ? 'border-rjb-yellow ring-2 sm:ring-4 ring-rjb-yellow/20'
                  : 'border-rjb-yellow/30 hover:border-rjb-yellow/50'
              }`}
              placeholder="Assunto da mensagem"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="body" className="block text-xs sm:text-sm font-semibold text-rjb-text dark:text-rjb-text-dark flex items-center gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Mensagem
            </label>
            <textarea
              id="body"
              required
              rows="5"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              onFocus={() => setFocusedField('body')}
              onBlur={() => setFocusedField(null)}
              className={`w-full p-3 sm:p-4 text-base rounded-lg sm:rounded-xl border-2 transition-all duration-300 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark resize-none ${
                focusedField === 'body'
                  ? 'border-rjb-yellow ring-2 sm:ring-4 ring-rjb-yellow/20'
                  : 'border-rjb-yellow/30 hover:border-rjb-yellow/50'
              }`}
              placeholder="Sua mensagem..."
            />
          </div>

          <button
            type="submit"
            className="group w-full bg-gradient-to-r from-rjb-yellow via-yellow-500 to-yellow-500 text-rjb-text font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <span>Enviar Mensagem</span>
          </button>
        </form>
      </div>
    </PageWrapper>
  )
}

export default Contato
