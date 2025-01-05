//  /components/ui/dialog.js
import React from 'react';

const Dialog = ({ children, ...props }) => (
  <div {...props} className="dialog-container">
    {children}
  </div>
);

export default Dialog;