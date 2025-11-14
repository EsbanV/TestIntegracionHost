import React from 'react';

type Props = {
  title: string;
  description?: string;
};

export const DetailDescription: React.FC<Props> = ({ title, description }) => {
  return (
    <section aria-labelledby="product-title" className="space-y-3">
      <h1 id="product-title" className="text-2xl font-semibold text-gray-900">
        {title}
      </h1>
      {description && <p className="text-gray-700 leading-relaxed">{description}</p>}
    </section>
  );
};