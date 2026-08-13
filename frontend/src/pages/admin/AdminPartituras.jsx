import Partituras from '../../components/admin/Partituras'

const AdminPartituras = () => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Partituras</h2>
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
          Cadastre, atualize e exclua partituras (PDF e SIB) no acervo público do site.
        </p>
      </div>
      <Partituras />
    </section>
  )
}

export default AdminPartituras
