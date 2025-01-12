// components/ui/alert.js

export function Alert({ children, variant }) {
  const alertClasses = {
    destructive: "bg-red-50 text-red-700 border border-red-300",
  };

  return <div className={`p-4 rounded ${alertClasses[variant]}`}>{children}</div>;
}

export function AlertDescription({ children }) {
  return <p>{children}</p>;
}
