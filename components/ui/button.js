// components/ui/button.js

export function Button({ children, onClick, className, disabled, type = "button", variant = "default" }) {
  const baseClasses = "px-4 py-2 rounded text-white";
  const variantClasses = {
    default: "bg-blue-500 hover:bg-blue-600",
    link: "text-blue-500 underline",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
