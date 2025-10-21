import React, { useState } from 'react'

type Props = {
  inline?: boolean // si true, renderiza dentro del flujo (útil para la columna de chats)
}

// Componente unificado (evita duplicados)
function ChatRulesComponent({ inline = false }: Props): React.ReactElement {
  // si está inline (pegado al listado de chats) dejamos cerrado por defecto
  const [open, setOpen] = useState<boolean>(() => !inline)

  // clases reutilizables
  const panelClass = inline
    ? `w-full mx-2 my-2 p-3 rounded-lg border shadow-sm bg-white/95 max-h-48 overflow-auto ${open ? '' : 'hidden'}`
    : `max-w-3xl mx-6 my-4 p-4 rounded-lg border shadow-sm bg-white/90 backdrop-blur-sm ${open ? '' : 'hidden'}`

  const headerClass = 'flex items-center justify-between gap-2'
  const titleClass = 'font-semibold text-sm text-slate-800'
  const primaryBtn = 'px-3 py-1 rounded-full bg-yellow-300 text-black text-sm hover:bg-yellow-200'
  const toggleBtn = 'px-2 py-1 rounded bg-gray-100 text-sm hover:bg-gray-200'

  const reopenBtnClass = inline
    ? 'w-full max-w-xs mx-auto px-3 py-2 rounded-full z-30 bg-yellow-300 text-black text-sm shadow-lg hover:bg-yellow-200'
    : 'fixed bottom-24 right-6 z-50 px-3 py-2 rounded-full bg-yellow-300 text-black text-sm shadow-lg hover:bg-yellow-200'

  const content = (
    <div className="mt-3 space-y-2 text-gray-700">
      <p className="text-sm">Bienvenido/a — para mantener la comunidad segura y útil, sigue estas normas:</p>

      <ul className="list-inside list-disc space-y-1 text-sm">
        <li><strong>Respeto:</strong> trata a los demás con cortesía. No se permiten insultos, amenazas ni lenguaje discriminatorio.</li>
        <li><strong>Sin acoso:</strong> no hostigar, perseguir ni compartir datos personales de otros usuarios.</li>
        <li><strong>Sin spam:</strong> evita publicaciones repetitivas, enlaces publicitarios no solicitados o mensajes fuera de contexto.</li>
        <li><strong>Contenido:</strong> no publicar material ilegal, sexual explícito ni contenido que incite al odio o la violencia.</li>
        <li><strong>Canal adecuado:</strong> usa los canales y temas adecuados según la conversación.</li>
        <li><strong>Moderación:</strong> sigue las indicaciones del equipo moderador. Las infracciones pueden conllevar advertencias o expulsión.</li>
        <li><strong>Reportes:</strong> si detectas abuso o contenido inapropiado, informa a moderación (usa el botón de reportar).</li>
      </ul>

      <p className="text-xs text-gray-500 mt-2">Estas reglas se aplican en todo el sistema. Gracias por contribuir a una comunidad respetuosa.</p>

      <div className="mt-3 flex justify-end">
        <button className={primaryBtn} onClick={() => setOpen(false)}>Cerrar</button>
      </div>
    </div>
  )

  return (
    <>
      {open ? (
        <section className={panelClass} aria-expanded={open}>
          <div className={headerClass}>
            <div className={titleClass}>Reglas del chat</div>
            <div className="flex items-center gap-2">
              {!inline && (
                <button
                  aria-label="Acción principal"
                  className={primaryBtn}
                  onClick={() => {
                    /* placeholder para acciones adicionales si se requieren */
                  }}
                >
                  Entendido
                </button>
              )}
              <button
                aria-label="Cerrar reglas"
                className={toggleBtn}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {content}
        </section>
      ) : (
        // botón visible cuando está cerrado (inline o global)
        <div className="flex items-center justify-center">
          <button
            aria-label="Abrir reglas del chat"
            className={reopenBtnClass}
            onClick={() => setOpen(true)}
          >
            Reglas del chat
          </button>
        </div>
      )}
    </>
  )
}

// export por defecto y named export para compatibilidad
export default ChatRulesComponent
export { ChatRulesComponent as ChatRules }