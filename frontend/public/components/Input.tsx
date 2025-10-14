import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  className?: string;
  borderColor?: string; // tailwind value: 'border-gray-200'
}

const Input: React.FC<InputProps> = ({
  error,
  label,
  className = "",
  borderColor = "border-gray-300",
  ...props
}) => (
  <div className="w-full">
    {label && <label className="block mb-1 font-medium text-gray-700">{label}</label>}
    <input
      className={`
        w-full px-4 py-2 rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2
        ${error ? "border-red-500 focus:ring-red-400" : `${borderColor} focus:ring-blue-400`}
        bg-white text-gray-900
        ${className}
      `}
      {...props}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

export default Input;