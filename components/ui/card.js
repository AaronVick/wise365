export function Card({ children, className }) {
  return <div className={`bg-white shadow rounded p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div className="mb-4">{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="text-lg font-bold">{children}</h2>;
}

export function CardDescription({ children }) {
  return <p className="text-gray-600">{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}
