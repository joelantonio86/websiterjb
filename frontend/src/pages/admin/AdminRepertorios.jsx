import Repertorios from '../../components/admin/Repertorio'

const AdminRepertorios = () => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Repertório</h2>
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">Crie e modifique o repertório de apresentações.</p>
      </div>
      <Repertorios></Repertorios>
    </section>
  )
}

export default AdminRepertorios

