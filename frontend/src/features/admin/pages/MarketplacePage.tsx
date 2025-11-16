import AdminLayout from '../layout/AdminLayout';
import PageTransition from '../components/PageTransition';
import EmptyCard from '../components/EmptyCard';

export default function AdminMarketplacePage() {
  return (
    <AdminLayout title="Marketplace">
      <PageTransition>
        <EmptyCard
          title={<div>Marketplace</div>}
          rows={[
            { icon: '🛒', label: 'Catálogo', content: <div>Herramientas para gestionar categorías y listados.<div className="muted">Estado: En diseño.</div></div> },
            { icon: '📈', label: 'Métricas', content: <div>Panel con KPIs clave del marketplace.<div className="muted">Estado: Próximamente.</div></div> },
          ]}
        />
      </PageTransition>
    </AdminLayout>
  );
}
