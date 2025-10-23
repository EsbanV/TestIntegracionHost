import React from "react";

const faqData = [
  {
    question: "¿Cómo puedo contactar al soporte?",
    answer: "Puedes escribirnos directamente usando el chat de ayuda o completar el formulario de contacto."
  },
  {
    question: "¿Dónde encuentro la documentación?",
    answer: "La documentación está disponible en la sección de recursos o puedes pedirla por el chat."
  },
  {
    question: "¿Cómo actualizo mi información de perfil?",
    answer: "Puedes actualizar tu información desde la sección 'Perfil' en el menú principal."
  },
  {
    question: "¿Qué hago si la aplicación no carga correctamente?",
    answer: "Intenta recargar la página. Si el problema persiste, borra la caché del navegador o prueba desde otro dispositivo."
  },
  {
    question: "¿Cómo reporto un error o sugerencia?",
    answer: "Puedes enviarnos tus comentarios usando el chat de ayuda o por correo electrónico a soporte@ejemplo.com."
  },
  {
    question: "¿Mis datos están seguros en esta plataforma?",
    answer: "Sí, utilizamos protocolos de seguridad y cifrado para proteger tu información personal."
  },
];

export default function FAQ() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Preguntas Frecuentes</h2>
      <div className="space-y-4">
        {faqData.map((item, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-white shadow">
            <h3 className="font-semibold">{item.question}</h3>
            <p className="text-gray-700 mt-2">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}