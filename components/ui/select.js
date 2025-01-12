// components/ui/select.js

export function Select({ children, className }) {
  return <div className={`select ${className}`}>{children}</div>;
}

export function SelectTrigger({ children, className }) {
  return <button className={`select-trigger ${className}`}>{children}</button>;
}

export function SelectValue({ children, className }) {
  return <span className={`select-value ${className}`}>{children}</span>;
}

export function SelectContent({ children, className }) {
  return <div className={`select-content ${className}`}>{children}</div>;
}

export function SelectItem({ children, className, onClick }) {
  return (
    <div
      className={`select-item ${className}`}
      onClick={onClick}
      role="menuitem"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export default Select;
