// components/ui/input.js

export function Input({ id, type, placeholder, value, onChange, className }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`border rounded px-3 py-2 w-full ${className}`}
    />
  );
}
