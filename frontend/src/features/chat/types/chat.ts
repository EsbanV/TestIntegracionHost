export interface Mensaje {
  id: number | string; // puede ser tempId string hasta que se confirme
  texto: string;
  autor: "yo" | "otro";
  estado?: "enviando" | "enviado" | "recibido" | "leido";
  hora: string;
}

export interface Chat {
  id: number;
  nombre: string;
  ultimoMensaje: string;
  mensajes: Mensaje[]; 
}
