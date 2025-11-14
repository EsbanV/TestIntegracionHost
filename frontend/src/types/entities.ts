// Tipos de entidades basados en el schema de Prisma
// Alineados con la base de datos para consistencia

// ========== USUARIOS ==========
export interface User {
  id: number;
  nombre: string;
  apellido?: string;
  correo: string;
  usuario: string;
  contrasena?: string; // Solo para creación/login, no devolver en respuestas
  rolId: number;
  estadoId: number;
  fechaRegistro?: Date;
  campus?: string;
  reputacion: number;

  // Relaciones opcionales (poblar según necesidad)
  rol?: Role;
  estado?: EstadoUsuario;

  // Campos calculados / para UI
  token?: string; // Solo para autenticación
  nombreCompleto?: string; // Calculado: nombre + apellido
}

// ========== ROLES Y ESTADOS ==========
export interface Role {
  id: number;
  nombre: string;
}

export interface EstadoUsuario {
  id: number;
  nombre: string;
}

export interface EstadoProducto {
  id: number;
  nombre: string;
}

export interface EstadoTransaccion {
  id: number;
  nombre: string;
}

export interface EstadoReporte {
  id: number;
  nombre: string;
}

// ========== CATEGORÍAS ==========
export interface Category {
  id: number;
  nombre: string;
  categoriaPadreId?: number;

  // Relaciones
  categoriaPadre?: Category;
  subcategorias?: Category[];
  productos?: Product[];
}

// ========== PRODUCTOS ==========
export interface Product {
  id: number;
  nombre: string;
  categoriaId?: number;
  vendedorId: number;
  precioAnterior?: number;
  precioActual?: number;
  descripcion?: string;
  calificacion?: number;
  cantidad?: number;
  fechaAgregado?: Date;
  estadoId: number;
  visible?: boolean;

  // Relaciones
  categoria?: Category;
  vendedor?: User;
  estado?: EstadoProducto;
  imagenes?: ImagenProducto[];
  transacciones?: Transaction[];
  favoritos?: Favorite[];

  // Campos calculados
  categoryName?: string;
  sellerName?: string;
  sellerRating?: number;
  sellerSales?: number;
  esFavorito?: boolean;
}

export interface ImagenProducto {
  id: number;
  productoId: number;
  urlImagen?: string; // Nota: en schema es Bytes, pero en TS string para URLs

  producto?: Product;
}

// ========== TRANSACCIONES ==========
export interface Transaction {
  id: number;
  productoId: number;
  compradorId: number;
  vendedorId: number;
  fecha: Date;
  estadoId: number;

  // Relaciones
  producto?: Product;
  comprador?: User;
  vendedor?: User;
  estado?: EstadoTransaccion;
  calificaciones?: Rating[];
}

// ========== CALIFICACIONES ==========
export interface Rating {
  id: number;
  transaccionId: number;
  calificadorId: number;
  calificadoId: number;
  puntuacion?: number;
  comentario?: string;
  fecha: Date;

  // Relaciones
  transaccion?: Transaction;
  calificador?: User;
  calificado?: User;
}

// ========== CARRITO ==========
export interface CartItem {
  id: number;
  usuarioId: number;
  productoId: number;
  cantidad: number;

  producto?: Product;
}

export interface Cart {
  usuarioId: number;
  items: CartItem[];
  total?: number;
  cantidadItems?: number;
}

// ========== MENSAJES ==========
export interface Message {
  id: number;
  remitenteId: number;
  destinatarioId: number;
  contenido?: string;
  tipo?: string;
  fechaEnvio: Date;
  leido: boolean;

  // Relaciones
  remitente?: User;
  destinatario?: User;

  // Campos calculados para UI
  esPropio?: boolean;
  horaFormateada?: string;
}

export interface Chat {
  usuarioId: number;
  usuario?: User;
  mensajes: Message[];
  ultimoMensaje?: Message;
  noLeidos?: number;
}

// ========== REPORTES ==========
export interface Report {
  id: number;
  reportanteId: number;
  usuarioReportadoId?: number;
  productoId?: number;
  motivo?: string;
  fecha: Date;
  estadoId: number;

  // Relaciones
  reportante?: User;
  usuarioReportado?: User;
  producto?: Product;
  estado?: EstadoReporte;
}

// ========== NOTIFICACIONES ==========
export interface Notification {
  id: number;
  usuarioId: number;
  tipo?: string;
  mensaje?: string;
  leido: boolean;
  fecha: Date;

  usuario?: User;
}

// ========== PUBLICACIONES ==========
export interface Publication {
  id: number;
  titulo?: string;
  cuerpo?: string;
  usuarioId: number;
  estado?: string;
  fecha: Date;
  visto?: boolean;

  // Relaciones
  usuario?: User;
  comentarios?: Comment[];
  likes?: number;
  shares?: number;
}

// ========== FOROS ==========
export interface Forum {
  id: number;
  nombre: string;
  descripcion?: string;
  creadorId: number;
  fechaCreacion: Date;

  // Relaciones
  creador?: User;
  publicaciones?: ForumPublication[];
}

export interface ForumPublication {
  id: number;
  foroId: number;
  autorId: number;
  titulo?: string;
  contenido?: string;
  fecha: Date;

  // Relaciones
  foro?: Forum;
  autor?: User;
  comentarios?: Comment[];
}

export interface Comment {
  id: number;
  publicacionId: number;
  autorId: number;
  contenido?: string;
  fecha: Date;

  // Relaciones
  publicacion?: ForumPublication;
  autor?: User;
}

// ========== UBICACIONES ==========
export interface Location {
  id: number;
  usuarioId: number;
  nombreLugar?: string;
  descripcion?: string;

  usuario?: User;
}

// ========== FAVORITOS ==========
export interface Favorite {
  id: number;
  usuarioId: number;
  productoId: number;
  fecha: Date;

  // Relaciones
  usuario?: User;
  producto?: Product;
}

// ========== SEGUIDORES ==========
export interface Follower {
  usuarioSigueId: number;
  usuarioSeguidoId: number;
  fecha: Date;

  usuarioSigue?: User;
  usuarioSeguido?: User;
}

// ========== ACTIVIDAD ==========
export interface UserActivity {
  id: number;
  usuarioId: number;
  accion?: string;
  detalles?: string;
  fecha: Date;

  usuario?: User;
}

// ========== RESUMEN USUARIO ==========
export interface UserSummary {
  usuarioId: number;
  totalProductos: number;
  totalVentas: number;
  totalCompras: number;
  promedioCalificacion: number;

  usuario?: User;
}

// ========== MÉTRICAS ==========
export interface DailyMetrics {
  id: number;
  fechaMetricas: Date;
  usuariosActivos: number;
  nuevosUsuarios: number;
  productosCreados: number;
  transaccionesCompletadas: number;
  mensajesEnviados: number;
}

// ========== DTOs PARA API ==========
export interface LoginCredentials {
  email: string; // correo
  password: string; // contrasena
}

export interface RegisterData {
  nombre: string;
  apellido?: string;
  correo: string;
  usuario: string;
  contrasena: string;
  campus?: string;
}

export interface CreateProductData {
  nombre: string;
  categoriaId?: number;
  precioActual?: number;
  descripcion?: string;
  cantidad?: number;
  imagenes?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  precioAnterior?: number;
  estadoId?: number;
  visible?: boolean;
}