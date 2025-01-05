// /components/ui/avatar.js
import React from 'react';

const Avatar = ({ children, className }) => (
  <div className={`avatar ${className}`}>
    {children}
  </div>
);

const AvatarImage = ({ src }) => (
  <img src={src} alt="Avatar" className="avatar-image" />
);

const AvatarFallback = ({ children }) => (
  <div className="avatar-fallback">
    {children}
  </div>
);

export { Avatar, AvatarImage, AvatarFallback };
