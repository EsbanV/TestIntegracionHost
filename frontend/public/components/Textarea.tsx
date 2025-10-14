import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  className?: string;
  borderColor?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  error,
  label,
  className = "",
  borderColor = "border-gray-300",
  ...props
}) => (
  <div className="w-full">
    {label && <label className="block mb-1 font-medium text-gray-700">{label}</label>}
    <textarea
      className={`
        w-full px-4 py-2 rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2
        ${error ? "border-red-500 focus:ring-red-400" : `${borderColor} focus:ring-blue-400`}
        bg-white text-gray-900 resize-y
        ${className}
      `}
      rows={3}
      {...props}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

export default Textarea;