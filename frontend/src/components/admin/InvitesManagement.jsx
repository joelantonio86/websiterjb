import { useState } from 'react'
import { showMessage } from '../MessageBox'
import api from '../../services/api'

const InvitesManagement = () => {
  const [generatedKey, setGeneratedKey] = useState('')
  const [showWhatsApp, setShowWhatsApp] = useState(false)

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const newKey = `RJB-AUTO-${code}`
    setGeneratedKey(newKey)
    setShowWhatsApp(true)

    // Salvar no backend
    api.post('/api/admin/generate-key', { inviteKey: newKey })
      .then(() => {
        navigator.clipboard.writeText(newKey)
        showMessage('Chave gerada e salva com sucesso!')
      })
      .catch(() => {
        showMessage('Chave gerada localmente. O servidor pode estar desatualizado.', true)
      })
  }

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      showMessage('Chave copiada para a área de transferência!')
    } else {
      showMessage('Gere uma chave primeiro.', true)
    }
  }

  const shareViaWhatsApp = () => {
    if (!generatedKey) return
    const siteUrl = 'https://www.racionaljazzband.com.br/#cadastro'
    const message = `Olá! Aqui é da RJB. 🎷\n\n` +
      `Já iniciamos a transição para o cadastro via site!\n\n` +
      `Acesse: ${siteUrl}\n` +
      `Use a chave: \`${generatedKey}\`\n\n` +
      `_Obs: Lembre-se de aceitar os termos de imagem (LGPD) ao finalizar._`
    const encodedMsg = encodeURIComponent(message)
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="bg-gradient-to-br from-rjb-card-light to-rjb-bg-light dark:from-rjb-card-dark dark:to-rjb-bg-dark/50 rounded-2xl shadow-xl border-2 border-rjb-yellow/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className="bg-gradient-to-r from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:via-rjb-yellow/5 dark:to-rjb-yellow/5 px-5 sm:px-6 py-4 border-b border-rjb-yellow/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rjb-yellow/30 to-rjb-yellow/20 dark:from-rjb-yellow/20 dark:to-rjb-yellow/10 shadow-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-rjb-text dark:text-rjb-text-dark">Gerenciamento de Convites</h3>
            <p className="text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 mt-0.5">Gere e compartilhe chaves de acesso</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={generatedKey || '--- CLIQUE PARA GERAR ---'}
              readOnly
              className="w-full p-3.5 sm:p-4 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border-2 border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark font-mono font-bold text-center text-sm sm:text-base focus:border-rjb-yellow focus:ring-2 focus:ring-rjb-yellow/20 transition-all"
            />
            <button
              onClick={copyKey}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rjb-text/50 hover:text-rjb-yellow transition-colors"
              title="Copiar chave"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
          <button
            onClick={generateKey}
            className="group bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-3.5 sm:py-4 px-6 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Gerar Nova Chave
          </button>
        </div>
        
        {showWhatsApp && generatedKey && (
          <button
            onClick={shareViaWhatsApp}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>Enviar via WhatsApp</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default InvitesManagement
