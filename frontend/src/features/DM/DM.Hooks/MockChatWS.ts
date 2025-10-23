/*import type { Chat, Mensaje } from "@/features/chat/types/chat";*/

export class MockChatWS {
  isOpen = false;
  readyState = 1; // 1 = OPEN

  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (evt: { data: string }) => void;
  onerror?: (e: any) => void;

  constructor() {
    setTimeout(() => {
      this.isOpen = true;
      if (typeof this.onopen === "function") this.onopen();
    }, 100);
  }

  send(data: string) {
    setTimeout(() => {
      const parsed = JSON.parse(data);

      if (parsed.tipo === "nuevo") {
        if (typeof this.onmessage === "function") {
          this.onmessage({
            data: JSON.stringify({
              tipo: "mensaje",
              chatId: parsed.chatId,
              mensaje: { ...parsed.mensaje, estado: "recibido" }
            })
          });
        }
      }

      if (parsed.tipo === "estado") {
        if (typeof this.onmessage === "function") {
          this.onmessage({
            data: JSON.stringify({
              tipo: "estado",
              chatId: parsed.chatId,
              mensajeId: parsed.mensajeId,
              estado: parsed.estado
            })
          });
        }
      }
    }, 500);
  }

  close() {
    this.isOpen = false;
    if (typeof this.onclose === "function") this.onclose();
  }
}