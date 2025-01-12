// components/ui/select.js

export function SelectTrigger({ children, className }) {
  return <button className={`select-trigger ${className}`}>{children}</button>;
}

export function SelectValue({ children, className }) {
  return <span className={`select-value ${className}`}>{children}</span>;
}

export function SelectContent({ children, className }) {
  return <div className={`select-content ${className}`}>{children}</div>;
}

export default SelectTrigger;
