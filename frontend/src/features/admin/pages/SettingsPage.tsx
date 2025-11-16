import AdminLayout from '../layout/AdminLayout';
import PageTransition from '../components/PageTransition';
import EmptyCard from '../components/EmptyCard';

export default function AdminSettingsPage() {
  return (
    <AdminLayout title="Ajustes">
      <PageTransition>
        <EmptyCard
          title={<div>Ajustes</div>}
          rows={[
            { icon: '🔐', label: 'Permisos', content: <div>Configura roles y permisos de usuarios.<div className="muted">Estado: Pendiente.</div></div> },
            { icon: '🎨', label: 'Tema', content: <div>Colores y estilos del panel de administración.<div className="muted">Estado: En revisión.</div></div> },
          ]}
        />
      </PageTransition>
    </AdminLayout>
  );
}
