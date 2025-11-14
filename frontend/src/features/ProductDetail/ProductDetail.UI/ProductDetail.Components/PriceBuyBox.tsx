import React from 'react';

type Props = {
  price?: number | string;
  stock?: number;
  onContact?: () => void;
};

const formatCLP = (v: number | string | undefined) => {
  const num = typeof v === 'number' ? v : parseInt(String(v ?? '0').replace(/\D/g, ''), 10);
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(num || 0);
};

export const PriceBuyBox: React.FC<Props> = ({ price, stock, onContact }) => {
  const disabled = stock === 0;

  return (
    <aside className="sticky top-6 space-y-4">
      <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Precio</div>
            <div className="text-3xl font-extrabold text-gray-900">{price != null ? formatCLP(price) : 'Consultar'}</div>
          </div>
          {typeof stock === 'number' && (
            <div className={`text-sm font-medium ${stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {stock > 0 ? `Stock: ${stock}` : 'Sin stock'}
            </div>
          )}
        </div>

        <button
          onClick={onContact}
          disabled={disabled}
          className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-disabled={disabled}
          title={disabled ? 'Sin stock' : 'Contactar vendedor'}
        >
          Contactar vendedor
        </button>

        <p className="mt-2 text-xs text-gray-500">Se abrirá el chat para coordinar la compra directamente con el vendedor.</p>
      </div>
    </aside>
  );
};