// src/components/SendMessageForm.tsx

import React, { useState } from 'react';

// NOTA: Debes crear un repositorio para mensajes (ej. MessageHttpRepository)
// Por ahora, usaremos fetch directo para simular la llamada al nuevo endpoint.

interface Props {
    senderId: number;
    recipientId: number;
    onMessageSent: (message: string) => void;
}

const SendMessageForm: React.FC<Props> = ({ senderId, recipientId, onMessageSent }) => {
    const [contenido, setContenido] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (contenido.trim() === '') {
            setError('El mensaje no puede estar vacío.');
            return;
        }
        
        // Simulación: No se puede enviar un mensaje a uno mismo
        if (senderId === recipientId) {
            setError('No puedes enviarte un mensaje a ti mismo.');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const payload = {
                destinatarioId: recipientId,
                contenido: contenido.trim(),
                // tipo: 'texto' (por defecto en el controlador)
            };
            
            // Simulación de la llamada al nuevo endpoint POST /api/mensajes
            const token = localStorage.getItem('token') || 'mock-token'; 
            const API_BASE = import.meta.env.VITE_API_URL || '/api';

            const res = await fetch(`${API_BASE}/mensajes`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
                throw new Error(errorData.error || errorData.detalles || 'Fallo al enviar el mensaje.');
            }

            // Éxito: Limpiar, notificar y actualizar el estado
            onMessageSent(contenido.trim());
            setContenido('');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error de red al enviar el mensaje.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <textarea
                value={contenido}
                onChange={(e) => { setContenido(e.target.value); setError(null); }}
                placeholder={`Envía un mensaje a ${recipientId}...`}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
            />
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={loading}
            >
                {loading ? 'Enviando...' : 'Enviar Mensaje al Vendedor'}
            </button>
        </form>
    );
};

export default SendMessageForm;