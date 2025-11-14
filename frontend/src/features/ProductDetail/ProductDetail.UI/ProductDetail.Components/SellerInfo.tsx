import React from 'react';

type Props = {
  name?: string;
  avatarUrl?: string;
  sellerId?: string;
};

export const SellerInfo: React.FC<Props> = ({ name = 'Vendedor', avatarUrl, sellerId }) => {
  return (
    <section aria-labelledby="seller" className="flex items-center gap-3 mt-4">
      <img
        src={avatarUrl || '/avatar-placeholder.png'}
        alt={`Avatar de ${name}`}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <div id="seller" className="text-sm font-medium text-gray-900">{name}</div>
        {sellerId && <div className="text-xs text-gray-500">ID: {sellerId}</div>}
      </div>
    </section>
  );
};