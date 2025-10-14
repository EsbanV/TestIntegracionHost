import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline-purple";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const sizeStyles = {
  sm: "px-3 py-1 text-sm",
  md: "px-5 py-2 text-base",
  lg: "px-7 py-3 text-lg"
};

const variantStyles = {
  primary: "bg-blue-600 text-white hover:bg-white hover:text-blue-600",
  secondary: "bg-white text-blue-600 hover:bg-blue-600 hover:text-white",
  "outline-purple":
    "bg-white border border-purple-500 text-purple-500 hover:bg-purple-600 hover:text-white"
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const base =
    "rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto";
  const styles = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};

export default Button;