import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const PoliticaPrivacidade = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    document.title = 'Política de Privacidade — Racional Jazz Band'
    setIsVisible(true)
  }, [])

  return (
    <PageWrapper title="Política de Privacidade">
      <div className={`max-w-3xl mx-auto prose prose-invert max-w-none transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="bg-rjb-card-light dark:bg-rjb-card-dark rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border-l-4 border-rjb-yellow">
          <h2 className="text-xl font-bold text-rjb-text dark:text-rjb-text-dark mb-4">Última atualização</h2>
          <p className="text-rjb-text/80 dark:text-rjb-text-dark/80 mb-6">
            Esta Política de Privacidade descreve como a Racional Jazz Band coleta, usa e protege as informações que você nos fornece ao utilizar nosso site.
          </p>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Informações que coletamos</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80 mb-2">
              Podemos coletar informações quando você:
            </p>
            <ul className="list-disc list-inside text-rjb-text/80 dark:text-rjb-text-dark/80 space-y-1 ml-2">
              <li>Preenche o formulário de contato (nome, e-mail, assunto e mensagem)</li>
              <li>Realiza cadastro como membro da banda</li>
              <li>Navega pelo site (dados de uso e cookies essenciais)</li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Uso das informações</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80">
              Utilizamos as informações coletadas para responder a contatos, gerenciar o cadastro de membros, melhorar nossos serviços e comunicar-nos com você quando necessário.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Proteção e compartilhamento</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80">
              Não vendemos, trocamos ou transferimos suas informações para terceiros, exceto quando necessário para o funcionamento do site ou exigido por lei.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Contato</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80">
              Para dúvidas sobre esta política, entre em contato através da nossa <Link to="/contato" className="text-rjb-yellow hover:underline">página de contato</Link>.
            </p>
          </section>
        </div>
      </div>
    </PageWrapper>
  )
}

export default PoliticaPrivacidade
