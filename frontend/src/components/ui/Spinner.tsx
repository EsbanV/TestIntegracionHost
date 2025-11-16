import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4'
};

const colorClasses = {
  primary: 'border-blue-600 border-t-transparent',
  secondary: 'border-gray-600 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent'
};

/**
 * Componente Spinner reutilizable para indicadores de carga
 * 
 * @example
 * <Spinner size="md" color="primary" />
 * <Spinner size="lg" color="white" label="Cargando..." />
 */
export default function Spinner({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  label
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={label || 'Cargando'}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      )}
    </div>
  );
}

/**
 * Variante inline del spinner para uso dentro de botones
 */
export function InlineSpinner({ size = 'sm', color = 'white' }: Pick<SpinnerProps, 'size' | 'color'>) {
  return (
    <div 
      className={`inline-block animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
      aria-label="Cargando"
    />
  );
}

/**
 * Spinner de pantalla completa con overlay
 */
export function FullScreenSpinner({ label }: Pick<SpinnerProps, 'label'>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <Spinner size="xl" color="primary" label={label || 'Cargando...'} />
      </div>
    </div>
  );
}
