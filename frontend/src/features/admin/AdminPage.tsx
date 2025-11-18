// AdminPage.tsx
import React from 'react';
import AdminLayout from './AdminLayout';
import {
  AdminStatsGrid,
  AdminSectionCard,
  AdminMiniTable,
  UserChip,
  ReportStatusChip,
  TransactionStatusChip,
} from './Admin.Components';
import {
  useAdminMetrics,
  useAdminUsers,
  useAdminReports,
  useAdminTransactions,
} from './admin.hooks';
import type {
  AdminUserListItem,
  AdminReport,
  AdminTransactionListItem,
} from './admin.types';

export default function AdminPage() {
  // Métricas de dashboard
  const { data: metricsData, isLoading: metricsLoading } = useAdminMetrics();

  // Listas pequeñas para vista rápida
  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    page: 1,
    pageSize: 5,
  });

  const { data: reportsData, isLoading: reportsLoading } = useAdminReports({
    page: 1,
    pageSize: 5,
  });

  const { data: txData, isLoading: txLoading } = useAdminTransactions({
    page: 1,
    pageSize: 5,
  });

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Resumen general del Marketplace Universitario"
    >
      {/* Métricas principales */}
      <AdminStatsGrid
        metrics={metricsData?.metrics}
        isLoading={metricsLoading}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Usuarios recientes */}
        <AdminSectionCard
          title="Usuarios recientes"
          description="Últimos usuarios registrados en la plataforma."
          actionLabel="Ver todos"
          onAction={() => {
            // navegación programática si quieres (por ejemplo, useNavigate)
            // navigate('/admin/usuarios');
          }}
        >
          <AdminMiniTable<AdminUserListItem>
            isLoading={usersLoading}
            rows={usersData?.users}
            emptyLabel="No hay usuarios recientes."
            columns={[
              {
                header: 'Usuario',
                accessor: (u) => <UserChip user={u} />,
              },
              {
                header: 'Correo',
                accessor: (u) => (
                  <span className="text-[11px] text-slate-500 truncate max-w-[150px] inline-block">
                    {u.email}
                  </span>
                ),
              },
              {
                header: 'Estado',
                accessor: (u) => (
                  <span className="text-[11px] text-slate-600">
                    {u.estadoNombre || 'Activo'}
                  </span>
                ),
              },
            ]}
          />
        </AdminSectionCard>

        {/* Reportes pendientes */}
        <AdminSectionCard
          title="Reportes recientes"
          description="Reportes de usuarios y productos que requieren revisión."
          actionLabel="Gestionar reportes"
          onAction={() => {
            // navigate('/admin/reportes');
          }}
        >
          <AdminMiniTable<AdminReport>
            isLoading={reportsLoading}
            rows={reportsData?.reports}
            emptyLabel="No hay reportes por ahora."
            columns={[
              {
                header: 'Motivo',
                accessor: (r) => (
                  <span className="text-[11px] text-slate-700 truncate max-w-[160px] inline-block">
                    {r.motivo || 'Sin motivo'}
                  </span>
                ),
              },
              {
                header: 'Objetivo',
                accessor: (r) => (
                  <span className="text-[11px] text-slate-500">
                    {r.producto
                      ? `Producto #${r.producto.id}`
                      : r.usuarioReportado
                      ? `Usuario @${r.usuarioReportado.usuario}`
                      : 'N/A'}
                  </span>
                ),
              },
              {
                header: 'Estado',
                accessor: (r) => <ReportStatusChip report={r} />,
              },
            ]}
          />
        </AdminSectionCard>

        {/* Transacciones recientes */}
        <AdminSectionCard
          title="Transacciones recientes"
          description="Actividad de compra/venta más reciente."
          actionLabel="Ver transacciones"
          onAction={() => {
            // navigate('/admin/transacciones');
          }}
        >
          <AdminMiniTable<AdminTransactionListItem>
            isLoading={txLoading}
            rows={txData?.transactions}
            emptyLabel="No hay transacciones recientes."
            columns={[
              {
                header: 'Producto',
                accessor: (t) => (
                  <span className="text-[11px] text-slate-700 truncate max-w-[140px] inline-block">
                    {t.producto?.nombre || 'Sin nombre'}
                  </span>
                ),
              },
              {
                header: 'Contraparte',
                accessor: (t) => (
                  <span className="text-[11px] text-slate-500">
                    {t.comprador?.usuario || t.vendedor?.usuario || 'N/A'}
                  </span>
                ),
              },
              {
                header: 'Estado',
                accessor: (t) => <TransactionStatusChip tx={t} />,
              },
            ]}
          />
        </AdminSectionCard>
      </div>
    </AdminLayout>
  );
}
