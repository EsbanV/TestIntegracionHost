import type { Chat } from "../types/chat";

export const mockChats: Chat[] = [
  {
    id: 1,
    nombre: "Demo Usuario",
    ultimoMensaje: "¡Hola, esto es un chat demo!",
    mensajes: [
      { id: 1, texto: "¡Hola!", autor: "yo", estado: "enviado", hora: "08:00" },
      { id: 2, texto: "¿Cómo estás?", autor: "otro", estado: "recibido", hora: "08:01" },
      { id: 3, texto: "¿Me ayudas con mi pedido?", autor: "otro", estado: "recibido", hora: "08:03" },
    ]
  },
  {
    id: 2,
    nombre: "Usuario Test",
    ultimoMensaje: "Mensaje de prueba",
    mensajes: [
      { id: 1, texto: "¡Esto es otro chat!", autor: "yo", estado: "enviado", hora: "09:00" },
      { id: 2, texto: "¿Está disponible el producto?", autor: "otro", estado: "recibido", hora: "09:01" },
      { id: 3, texto: "¿Cuándo puedo retirar?", autor: "otro", estado: "recibido", hora: "09:02" },
    ]
  },
  {
    id: 3,
    nombre: "Cliente Nuevo",
    ultimoMensaje: "¡Gracias!",
    mensajes: [
      { id: 1, texto: "¿Tienen descuentos?", autor: "otro", estado: "recibido", hora: "09:10" }
    ]
  }
];