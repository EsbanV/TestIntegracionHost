// Admin.Components.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type {
  AdminMetrics,
  AdminUserListItem,
  AdminReport,
  AdminTransactionListItem,
} from './admin.types';

type AdminStatsGridProps = {
  metrics?: AdminMetrics;
  isLoading: boolean;
};

export const AdminStatsGrid: React.FC<AdminStatsGridProps> = ({
  metrics,
  isLoading,
}) => {
  const cards = [
    {
      label: 'Usuarios totales',
      icon: Users,
      value: metrics?.totalUsers ?? 0,
    },
    {
      label: 'Productos publicados',
      icon: Package,
      value: metrics?.totalProducts ?? 0,
    },
    {
      label: 'Transacciones completadas',
      icon: ShoppingBag,
      value: metrics?.completedTransactions ?? 0,
    },
    {
      label: 'Reportes abiertos',
      icon: AlertTriangle,
      value: metrics?.openReports ?? 0,
      accent: 'text-amber-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-slate-200">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        : cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <Card className="border-slate-200 bg-white/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-slate-500">
                    {card.label}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-semibold tracking-tight ${
                        card.accent || 'text-slate-900'
                      }`}
                    >
                      {card.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
    </div>
  );
};

// ---- Sección genérica con título + acción opcional ----

type AdminSectionCardProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
};

export const AdminSectionCard: React.FC<AdminSectionCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  children,
}) => {
  return (
    <Card className="border-slate-200 bg-white/90">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold text-slate-800">
            {title}
          </CardTitle>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {actionLabel}
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
};

// ---- Tabla mini genérica para dashboard ----

type Column<T> = {
  header: string;
  accessor: (row: T) => React.ReactNode;
};

type AdminMiniTableProps<T> = {
  columns: Column<T>[];
  rows?: T[];
  isLoading: boolean;
  emptyLabel?: string;
};

export function AdminMiniTable<T extends { id: number }>({
  columns,
  rows,
  isLoading,
  emptyLabel = 'Sin datos para mostrar',
}: AdminMiniTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic py-2">{emptyLabel}</p>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-3 py-2 text-left font-semibold text-slate-600"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.header}
                  className="px-3 py-2 align-middle text-slate-700"
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helpers específicos para el dashboard (puedes usarlos o ignorarlos)

export const UserChip: React.FC<{ user: AdminUserListItem }> = ({ user }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-medium text-slate-800 truncate max-w-[140px]">
      {user.nombre || user.usuario}
    </span>
    <Badge variant="outline" className="text-[10px]">
      {user.rol || 'Usuario'}
    </Badge>
  </div>
);

export const ReportStatusChip: React.FC<{ report: AdminReport }> = ({
  report,
}) => (
  <Badge
    variant="outline"
    className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
  >
    {report.estado?.nombre || 'Pendiente'}
  </Badge>
);

export const TransactionStatusChip: React.FC<{
  tx: AdminTransactionListItem;
}> = ({ tx }) => (
  <Badge
    variant="outline"
    className="text-[10px] border-slate-300 text-slate-700 bg-slate-50"
  >
    {tx.estadoNombre || 'Sin estado'}
  </Badge>
);
