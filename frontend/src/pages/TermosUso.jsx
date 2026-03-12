import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const TermosUso = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    document.title = 'Termos de Uso — Racional Jazz Band'
    setIsVisible(true)
  }, [])

  return (
    <PageWrapper title="Termos de Uso">
      <div className={`max-w-3xl mx-auto prose prose-invert max-w-none transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="bg-rjb-card-light dark:bg-rjb-card-dark rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border-l-4 border-rjb-yellow">
          <h2 className="text-xl font-bold text-rjb-text dark:text-rjb-text-dark mb-4">Termos de Uso</h2>
          <p className="text-rjb-text/80 dark:text-rjb-text-dark/80 mb-6">
            Ao acessar e utilizar o site da Racional Jazz Band, você concorda com os seguintes termos:
          </p>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Uso do site</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80">
              O conteúdo do site — músicas, partituras, vídeos e textos — é de uso restrito e destinado ao conhecimento da Cultura Racional e à divulgação da banda. O material não pode ser utilizado para fins comerciais sem autorização prévia.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Partituras e mídia</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80">
              As partituras e arquivos de áudio disponíveis são para estudo e prática pessoal. A reprodução ou distribuição em larga escala requer permissão da Racional Jazz Band.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Conduta do usuário</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80">
              Ao utilizar formulários e áreas interativas, o usuário se compromete a fornecer informações verdadeiras e a não fazer uso do site para atividades ilegais ou que prejudiquem terceiros.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-rjb-yellow mb-2">Alterações</h3>
            <p className="text-rjb-text/80 dark:text-rjb-text-dark/80">
              Estes termos podem ser atualizados periodicamente. O uso continuado do site após alterações constitui aceitação dos novos termos. Em caso de dúvidas, entre em <Link to="/contato" className="text-rjb-yellow hover:underline">contato</Link> conosco.
            </p>
          </section>
        </div>
      </div>
    </PageWrapper>
  )
}

export default TermosUso
