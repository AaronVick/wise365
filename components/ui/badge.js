// /components/ui/badge.js
import React from 'react';

const Badge = ({ children, color }) => (
  <span className={`badge badge-${color}`}>{children}</span>
);

export default Badge;
