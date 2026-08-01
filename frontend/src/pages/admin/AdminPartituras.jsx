import AttachmentsManagement from '../../components/admin/AttachmentsManagement'
import Partituras from '../../components/admin/Partituras'

const AdminPartituras = () => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Partituras da RJB</h2>
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">Gerencie as partituras da RJB.</p>
      </div>
      <Partituras />
    </section>
  )
}

export default AdminPartituras

