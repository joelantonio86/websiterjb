import AttachmentsManagement from '../../components/admin/AttachmentsManagement'

const AdminMedia = () => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-rjb-text dark:text-rjb-text-dark">Mídia do Site</h2>
        <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">Fotos por upload e vídeos por link do YouTube.</p>
      </div>
      <AttachmentsManagement />
    </section>
  )
}

export default AdminMedia

