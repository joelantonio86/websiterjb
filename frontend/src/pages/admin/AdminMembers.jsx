import MembersReport from '../../components/admin/MembersReport'

const AdminMembers = () => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Membros</h2>
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">Consulte, filtre e administre membros.</p>
      </div>
      <MembersReport />
    </section>
  )
}

export default AdminMembers

