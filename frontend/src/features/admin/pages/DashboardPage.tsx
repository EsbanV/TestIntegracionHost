import AdminLayout from '../AdminLayout';
import { 
  PageTransition, 
  StatCard, 
  InfoCard, 
  StatusBadge 
} from '@/features/admin/components/AdminComponents'; 
import { useAdminMetrics } from '../hooks/useAdmin'; // Hook de métricas real
import { Users, FileText, AlertTriangle, Activity, Server, Database, Clock, CheckCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  // Consumir métricas reales del backend
  const { data: metrics, isLoading, isError } = useAdminMetrics();

  return (
    <AdminLayout title="Dashboard">
      <PageTransition>
        {/* Grid de Estadísticas Reales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <StatCard 
            title="Usuarios" 
            value={isLoading ? '...' : (metrics?.totalUsers ?? 0)} 
            subtitle="Total registrados" 
            icon={<Users className="h-4 w-4" />}
          />
          
          <StatCard 
            title="Publicaciones" 
            value={isLoading ? '...' : (metrics?.totalPublications ?? 0)} 
            subtitle="Total activas" 
            icon={<FileText className="h-4 w-4" />}
          />
          
          <StatCard 
            title="Reportes" 
            value={isLoading ? '...' : (metrics?.openReports ?? 0)} 
            subtitle="Casos pendientes" 
            variant={metrics?.openReports > 0 ? "negative" : "default"}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          
          <StatCard 
            title="Ventas" 
            value={isLoading ? '...' : (metrics?.completedTransactions ?? 0)} 
            subtitle="Transacciones exitosas" 
            variant="positive" 
            icon={<CheckCircle className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estado del Sistema */}
          <div>
            <h3 className="text-lg font-medium mb-4">Estado del sistema</h3>
            <InfoCard
              rows={[
                { 
                  icon: <Server className="h-4 w-4" />, 
                  label: 'API Backend', 
                  content: <StatusBadge status={isError ? 'err' : 'ok'} label={isError ? 'Error' : 'Online'} /> 
                },
                { 
                  icon: <Database className="h-4 w-4" />, 
                  label: 'Base de datos', 
                  content: <StatusBadge status="ok" label="Conectada" /> 
                },
                { 
                  icon: <Clock className="h-4 w-4" />, 
                  label: 'Sincronización', 
                  content: <StatusBadge status={isLoading ? 'warn' : 'ok'} label={isLoading ? 'Cargando...' : 'Al día'} /> 
                },
              ]}
            />
          </div>

          {/* Resumen de Actividad (Opcional, usando datos extra si los hay) */}
          <div>
             <h3 className="text-lg font-medium mb-4">Actividad Reciente</h3>
             <InfoCard
              rows={[
                { 
                  icon: <Activity className="h-4 w-4" />, 
                  label: 'Usuarios Activos (30d)', 
                  content: isLoading ? '...' : (metrics?.activeUsers30d ?? 0)
                },
                { 
                  icon: <FileText className="h-4 w-4" />, 
                  label: 'Productos Totales', 
                  content: isLoading ? '...' : (metrics?.totalProducts ?? 0)
                },
              ]}
            />
          </div>
        </div>
      </PageTransition>
    </AdminLayout>
  );
}