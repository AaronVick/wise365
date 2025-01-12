// components/ui/button.js

// components/ui/button.js

export const buttonVariants = {
  default: "bg-blue-500 hover:bg-blue-600 text-white",
  link: "text-blue-500 underline",
  green: "bg-green-500 hover:bg-green-600 text-white",
  red: "bg-red-500 hover:bg-red-600 text-white",
  secondary: "bg-gray-500 text-white", // Additional variant from suggested code
  danger: "bg-red-500 text-white", // For compatibility with other parts of your app
};

export function Button({
  children,
  onClick,
  className = "",
  disabled,
  type = "button",
  variant = "default",
  ...props
}) {
  const baseClasses = "px-4 py-2 rounded";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${buttonVariants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button; // Default export for consistency
