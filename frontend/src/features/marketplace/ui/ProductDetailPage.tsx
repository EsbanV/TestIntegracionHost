// src/pages/ProductDetailPage.tsx (Versión de Prueba)

import React, { useState } from 'react';
import { PostHttpRepository } from '@/repositories/PostHttpRepository'; // Repositorio existente
import SendMessageForm from './components/SendMessageForm'; // Componente que crearemos

// Datos simulados para el producto y el vendedor
const MOCK_PRODUCT = {
    id: '101',
    title: 'Libro de Cálculo Avanzado',
    description: 'Edición 2024, casi nuevo.',
    price: 15000,
    sellerId: 1, // ID del vendedor (debe coincidir con el vendedor1 en el seed)
    sellerUsername: 'vendedor1',
    // ... otros campos
};

// Asumimos que el usuario actual (el comprador) tiene ID 2 para la prueba
const MOCK_CURRENT_USER_ID = 2; 

const repo = new PostHttpRepository(); // Usaremos este repo para métodos de API

export default function ProductDetailPage() {
    const [messageStatus, setMessageStatus] = useState('');

    const handleMessageSent = (message: string) => {
        setMessageStatus(`Mensaje Enviado: "${message}"`);
        setTimeout(() => setMessageStatus(''), 5000); // Limpiar después de 5s
    };
    
    // Simulación de carga de producto
    if (!MOCK_PRODUCT) return <div>Cargando detalle del producto...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{MOCK_PRODUCT.title}</h1>
            <p className="text-xl font-semibold text-green-600 mb-6">${MOCK_PRODUCT.price.toLocaleString('es-CL')}</p>
            <p className="text-gray-700 mb-8">{MOCK_PRODUCT.description}</p>
            
            <div className="p-4 bg-gray-50 border-t border-b border-gray-200 mb-8">
                <p className="text-sm text-gray-600">
                    Vendido por: <span className="font-semibold">{MOCK_PRODUCT.sellerUsername}</span> (ID: {MOCK_PRODUCT.sellerId})
                </p>
            </div>

            {/* Formulario de Mensaje al Vendedor */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-t pt-6">Contactar al Vendedor</h2>
            
            {messageStatus && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
                    {messageStatus}
                </div>
            )}

            <SendMessageForm
                senderId={MOCK_CURRENT_USER_ID} // ID del usuario actual
                recipientId={MOCK_PRODUCT.sellerId} // ID del vendedor
                onMessageSent={handleMessageSent}
            />
            
        </div>
    );
}