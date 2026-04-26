interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`w-full border border-gray-300 focus:border-emerald-700 rounded-2xl px-4 py-3 outline-none ${className}`}
        {...props}
      />
    </div>
  );
}