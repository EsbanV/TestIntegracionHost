// AdminSettingsPage.tsx
import React from 'react';
import AdminLayout from './AdminLayout';
import { AdminSectionCard } from './Admin.Components';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  return (
    <AdminLayout
      title="Ajustes"
      subtitle="Preferencias generales del panel de administración."
    >
      <AdminSectionCard
        title="Preferencias del panel"
        description="Estas opciones solo afectan a tu vista de administrador."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-slate-800">
                Tema oscuro del panel
              </Label>
              <p className="text-xs text-slate-500">
                (Placeholder) Podrías conectar esto con tu theme global.
              </p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-slate-800">
                Notificaciones de reportes
              </Label>
              <p className="text-xs text-slate-500">
                Recibir alertas al abrir sesión cuando existan reportes
                pendientes.
              </p>
            </div>
            <Switch disabled />
          </div>
        </div>
      </AdminSectionCard>
    </AdminLayout>
  );
}
