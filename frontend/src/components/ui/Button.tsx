import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline';
}

export default function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = "px-6 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50";
  const variants = {
    primary: "bg-emerald-700 hover:bg-emerald-800 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border border-emerald-700 text-emerald-700 hover:bg-emerald-50",
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}