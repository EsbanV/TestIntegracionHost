// admin.types.ts

// ==========================
// Helpers genéricos
// ==========================

export interface AdminPaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ==========================
// 📊 DASHBOARD & MÉTRICAS
// ==========================

export interface AdminNewUsersPoint {
  day: string;
  count: number;
}

export interface AdminMetrics {
  totalUsers: number;
  totalProducts: number;
  completedTransactions: number;
  openReports: number;
  hiddenProducts: number;
  totalReports: number;
  activeUsers30d: number;
  newUsersChart: AdminNewUsersPoint[];
}

export interface AdminMetricsResponse {
  metrics: AdminMetrics;
}

export interface AdminDailyMetric {
  id?: number;
  fechaMetricas: string; // viene como Date/ISO string
  [key: string]: any;
}

export interface AdminDailyMetricsResponse {
  days: number;
  data: AdminDailyMetric[];
}

// ==========================
// 📚 LOOKUPS
// ==========================

export interface AdminRole {
  id: number;
  nombre: string;
  [key: string]: any;
}

export interface AdminUserStatus {
  id: number;
  nombre: string;
  [key: string]: any;
}

export interface AdminProductStatus {
  id: number;
  nombre: string;
  [key: string]: any;
}

export interface AdminTransactionStatus {
  id: number;
  nombre: string;
  [key: string]: any;
}

export interface AdminReportStatus {
  id: number;
  nombre: string;
  [key: string]: any;
}

export interface AdminCategory {
  id: number;
  nombre: string;
  categoriaPadreId: number | null;
  [key: string]: any;
}

export interface AdminLookupsResponse {
  roles: AdminRole[];
  userStatuses: AdminUserStatus[];
  productStatuses: AdminProductStatus[];
  transactionStatuses: AdminTransactionStatus[];
  reportStatuses: AdminReportStatus[];
  categories: AdminCategory[];
}

// ==========================
// 👥 USUARIOS
// ==========================

export interface AdminUserListItem {
  id: number;
  nombre: string | null;
  email: string;
  usuario: string;
  rol: string | null;
  rolId: number | null;
  estadoId: number;
  estadoNombre: string | null;
  banned: boolean;
  campus: string | null;
  reputacion: number;
  fechaRegistro: string;
  resumen: any | null; // viene de resumenUsuario
}

export interface AdminUserListResponse extends AdminPaginatedMeta {
  users: AdminUserListItem[];
}

export interface AdminUserDetail {
  id: number;
  nombre: string | null;
  email: string;
  usuario: string;
  telefono: string | null;
  direccion: string | null;
  campus: string | null;
  rolId: number | null;
  rolNombre: string | null;
  estadoId: number;
  estadoNombre: string | null;
  reputacion: number;
  fechaRegistro: string;
  resumen: any | null;
}

export interface AdminUserActivity {
  [key: string]: any;
}

export interface AdminUserActivityResponse extends AdminPaginatedMeta {
  activities: AdminUserActivity[];
}

export interface AdminUserProductListItem {
  id: number;
  title: string;
  price: number | null;
  visible: boolean;
  estadoId: number;
  estadoNombre: string | null;
  categoryName: string | null;
  createdAt: string;
}

export interface AdminUserProductsResponse extends AdminPaginatedMeta {
  products: AdminUserProductListItem[];
}

export type AdminUserTransactionType = 'compra' | 'venta';

export interface AdminUserTransactionItem {
  id: number;
  tipo: AdminUserTransactionType;
  fecha: string;
  estadoId: number;
  estadoNombre: string | null;
  producto: {
    id: number;
    nombre: string;
  };
  contraparte: {
    id: number;
    nombre: string | null;
    usuario: string;
  };
  cantidad: number;
  precioTotal: number | null;
}

export interface AdminUserTransactionsResponse {
  transactions: AdminUserTransactionItem[];
  page: number;
  pageSize: number;
}

export interface AdminUsersFilters {
  q?: string;
  rolId?: number;
  estadoId?: number;
  campus?: string;
  page?: number;
  pageSize?: number;
}

// payloads / responses de mutaciones de usuario
export interface AdminCreateUserPayload {
  nombre?: string;
  correo: string;
  usuario: string;
  contrasena: string;
  rolId?: number;
  campus?: string;
  estadoId?: number;
}

export interface AdminCreateUserResponse {
  success: boolean;
  user: any; // registro completo de cuentas
}

export interface AdminUpdateUserPayload {
  nombre?: string;
  correo?: string;
  usuario?: string;
  rolId?: number;
  campus?: string;
  estadoId?: number;
  telefono?: string;
  direccion?: string;
}

export interface AdminBanUserPayload {
  banned: boolean;
}

export interface AdminSimpleSuccessResponse {
  success: boolean;
  message?: string;
}

// ==========================
// 📦 PRODUCTOS
// ==========================

export interface AdminProductListItem {
  id: number;
  title: string;
  author: string;
  vendorId: number | null;
  price: number | null;
  categoryName: string | null;
  createdAt: string;
  status: 'published' | 'hidden';
  visible: boolean;
  estadoId: number;
  estadoNombre: string | null;
}

export interface AdminProductsFilters {
  q?: string;
  estadoId?: number;
  vendedorId?: number;
  categoriaId?: number;
  visible?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminProductsListResponse extends AdminPaginatedMeta {
  products: AdminProductListItem[];
}

export type AdminProductDetail = any; // /products/:id devuelve el objeto Prisma completo

export interface AdminToggleProductVisibilityResponse {
  success: boolean;
  visible: boolean;
}

export interface AdminUpdateProductStatusPayload {
  estadoId?: number;
  visible?: boolean;
  cantidad?: number;
  estadoProducto?: string;
  tiempoUso?: string;
}

export interface AdminUpdateProductStatusResponse {
  success: boolean;
  product: any;
}

// ==========================
// 🧩 CATEGORÍAS
// ==========================

export type AdminCategoriesListResponse = AdminCategory[];

export interface AdminCreateCategoryPayload {
  nombre: string;
  categoriaPadreId?: number | null;
}

export interface AdminUpdateCategoryPayload {
  nombre?: string;
  categoriaPadreId?: number | null;
}

export interface AdminCategoryMutationResponse {
  success: boolean;
  category: AdminCategory;
}

// ==========================
// 🚨 REPORTES
// ==========================

export interface AdminReport {
  id: number;
  motivo?: string | null;
  descripcion?: string | null;
  estadoId: number;
  fecha: string;
  estado?: {
    id: number;
    nombre: string;
  } | null;
  reportante?: {
    id: number;
    nombre: string | null;
    usuario: string;
  } | null;
  usuarioReportado?: {
    id: number;
    nombre: string | null;
    usuario: string;
  } | null;
  producto?: {
    id: number;
    nombre: string;
    visible: boolean;
  } | null;
  [key: string]: any;
}

export interface AdminReportsFilters {
  estadoId?: number;
  tipo?: 'usuario' | 'producto' | 'todos';
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminReportsListResponse extends AdminPaginatedMeta {
  reports: AdminReport[];
}

export type AdminReportDetail = AdminReport;

export interface AdminUpdateReportStatusPayload {
  estadoId?: number;
  banUser?: boolean;
  hideProduct?: boolean;
}

export interface AdminUpdateReportStatusResponse {
  success: boolean;
  actions: number;
}

// ==========================
// 💸 TRANSACCIONES GLOBALES
// ==========================

export interface AdminTransactionListItem {
  id: number;
  fecha: string;
  estadoId: number;
  estadoNombre: string | null;
  producto: {
    id: number;
    nombre: string;
  } | null;
  comprador: {
    id: number;
    nombre: string | null;
    usuario: string;
  } | null;
  vendedor: {
    id: number;
    nombre: string | null;
    usuario: string;
  } | null;
  cantidad: number;
  precioUnitario: number | null;
  precioTotal: number | null;
  confirmacionVendedor: boolean;
  confirmacionComprador: boolean;
}

export interface AdminTransactionsFilters {
  estadoId?: number;
  compradorId?: number;
  vendedorId?: number;
  productoId?: number;
  page?: number;
  pageSize?: number;
}

export interface AdminTransactionsListResponse extends AdminPaginatedMeta {
  transactions: AdminTransactionListItem[];
}

export type AdminTransactionDetail = any;

export interface AdminUpdateTransactionStatusPayload {
  estadoId?: number;
  confirmacionVendedor?: boolean;
  confirmacionComprador?: boolean;
}

export interface AdminUpdateTransactionStatusResponse {
  success: boolean;
  transaction: any;
}

// ==========================
// 📝 PUBLICACIONES & COMENTARIOS
// ==========================

export interface AdminPostListItem {
  id: number;
  titulo: string | null;
  cuerpo: string | null;
  usuario: {
    id: number;
    nombre: string | null;
    usuario: string;
  };
  estado: string | null;
  fecha: string;
  visto: boolean;
  totalComentarios: number;
}

export interface AdminPostsFilters {
  q?: string;
  usuarioId?: number;
  estado?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminPostsListResponse extends AdminPaginatedMeta {
  posts: AdminPostListItem[];
}

export type AdminPostDetail = any;

export interface AdminCommentsFilters {
  publicacionId?: number;
  autorId?: number;
  onlyRoot?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminComment {
  [key: string]: any;
}

export interface AdminCommentsListResponse extends AdminPaginatedMeta {
  comments: AdminComment[];
}

// ==========================
// 💬 MENSAJES COMUNIDAD
// ==========================

export interface AdminCommunityMessage {
  [key: string]: any;
}

export interface AdminCommunityMessagesResponse extends AdminPaginatedMeta {
  messages: AdminCommunityMessage[];
}
