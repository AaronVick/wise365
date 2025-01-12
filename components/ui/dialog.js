// components/ui/dialog.js
export function Dialog({ children, className }) {
  return <div className={`dialog ${className}`}>{children}</div>;
}

export function DialogContent({ children }) {
  return <div className="dialog-content">{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="dialog-header">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="dialog-title">{children}</h2>;
}

export function DialogFooter({ children }) {
  return <div className="dialog-footer">{children}</div>;
}

export default Dialog;
