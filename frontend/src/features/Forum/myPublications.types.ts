// src/features/forum/types/myPublications.types.ts

export interface Publication {
  id: number;
  titulo: string;
  cuerpo: string;
  fecha: string; // ISO string
  estado: string;
  visto: boolean;
  usuario: { 
    id: number; 
    nombre: string; 
    usuario: string;
  };
}

export interface UpdatePublicationData {
  id: number;
  titulo: string;
  cuerpo: string;
}