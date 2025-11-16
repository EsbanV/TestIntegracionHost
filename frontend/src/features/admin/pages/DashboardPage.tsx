import AdminLayout from '../layout/AdminLayout';
import { 
  PageTransition, 
  StatCard, 
  InfoCard, 
  StatusBadge 
} from '@/features/admin/components/AdminComponents'; // Importamos desde el archivo unificado
import { 
  useAdminUsers, 
  useUpdateUserRole, 
  useBanUser, 
  useDeleteUser 
} from '../hooks/useAdmin';
import { Users, FileText, AlertTriangle, Activity, Server, Database, Clock } from 'lucide-react';

export default function AdminDashboardPage() {
  const { 
    data: users = [], 
    isLoading: loading, 
    isError: error 
  } = useAdminUsers('');

  return (
    <AdminLayout title="Dashboard">
      <PageTransition>
        {/* Grid de Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Usuarios" 
            value={loading ? '...' : users.length} 
            subtitle={error ? 'Error cargando' : 'Total registrados'} 
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard 
            title="Publicaciones" 
            value="—" 
            subtitle="Total publicadas" 
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard 
            title="Reportes" 
            value="—" 
            subtitle="Pendientes" 
            variant="negative" 
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <StatCard 
            title="Activos hoy" 
            value="—" 
            subtitle="Usuarios activos" 
            variant="positive" 
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* Estado del Sistema */}
        <h3 className="text-lg font-medium mb-4">Estado del sistema</h3>
        <InfoCard
          className="max-w-2xl"
          rows={[
            { 
              icon: <Server className="h-4 w-4" />, 
              label: 'API Backend', 
              content: <StatusBadge status={error ? 'err' : 'ok'} label={error ? 'Error' : 'Online'} /> 
            },
            { 
              icon: <Database className="h-4 w-4" />, 
              label: 'Base de datos', 
              content: <StatusBadge status="ok" label="Conectada" /> 
            },
            { 
              icon: <Clock className="h-4 w-4" />, 
              label: 'Sincronización', 
              content: <StatusBadge status={loading ? 'warn' : 'ok'} label={loading ? 'Cargando...' : 'Al día'} /> 
            },
          ]}
        />
      </PageTransition>
    </AdminLayout>
  );
}