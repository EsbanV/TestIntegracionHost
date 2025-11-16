// Basado en el schema.prisma y la respuesta de /api/admin/users
export type AdminUser = {
  id: number; // Es 'Int' en Prisma
  nombre?: string | null; // El backend envía 'nombre'
  email: string;
  usuario: string;
  rol: 'USER' | 'MODERATOR' | 'ADMIN'; // El backend envía 'rol' en mayúsculas
  banned: boolean;
  fechaCreacion?: string; // El backend envía 'fechaCreacion'
  carrera?: string | null;
  campus?: string | null;
  telefono?: string | null;
};