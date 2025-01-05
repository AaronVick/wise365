// /components/ui/dropdown-menu.js
import React from 'react';

const DropdownMenu = ({ children }) => (
  <div className="dropdown-menu">
    {children}
  </div>
);

const DropdownMenuTrigger = ({ children, ...props }) => (
  <div className="dropdown-trigger" {...props}>
    {children}
  </div>
);

const DropdownMenuContent = ({ children }) => (
  <div className="dropdown-content">
    {children}
  </div>
);

const DropdownMenuItem = ({ children, ...props }) => (
  <div className="dropdown-item" {...props}>
    {children}
  </div>
);

const DropdownMenuSeparator = () => <div className="dropdown-separator" />;

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };
