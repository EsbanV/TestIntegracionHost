import AdminLayout from '../layout/AdminLayout';
import PageTransition from '../components/PageTransition';
import EmptyCard from '../components/EmptyCard';

export default function AdminPostsPage() {
  return (
    <AdminLayout title="Publicaciones">
      <PageTransition>
        <EmptyCard
          title={<div>Publicaciones</div>}
          rows={[
            { icon: '🧾', label: 'Publicaciones', content: <div>En esta sección verás el total de publicaciones.<div className="muted">Estado: Sin datos disponibles.</div></div> },
            { icon: '⚙️', label: 'Moderación', content: <div>Aquí podrás aprobar/rechazar publicaciones.<div className="muted">Estado: Pendiente de integración.</div></div> },
          ]}
        />
      </PageTransition>
    </AdminLayout>
  );
}
