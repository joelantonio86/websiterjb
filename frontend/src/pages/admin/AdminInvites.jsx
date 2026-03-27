import InvitesManagement from '../../components/admin/InvitesManagement'

const AdminInvites = () => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Convites</h2>
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">Gere e compartilhe chaves de acesso.</p>
      </div>
      <InvitesManagement />
    </section>
  )
}

export default AdminInvites

