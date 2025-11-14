import React from 'react';

type Props = {
  attributes?: Record<string, string | number>;
};

export const DetailAttributes: React.FC<Props> = ({ attributes }) => {
  if (!attributes || Object.keys(attributes).length === 0) return null;

  return (
    <section aria-labelledby="attrs" className="mt-4">
      <h2 id="attrs" className="text-sm font-medium text-gray-800 mb-2">Características</h2>
      <ul className="text-sm text-gray-700 space-y-1">
        {Object.entries(attributes).map(([k, v]) => (
          <li key={k}>
            <span className="font-semibold text-gray-900">{k}:</span> {String(v)}
          </li>
        ))}
      </ul>
    </section>
  );
};