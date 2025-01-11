// components.Accordion.js
import React from 'react';

// Accordion Context and Hook
const AccordionContext = React.createContext();

export function Accordion({ children, type = 'single', collapsible = false, className }) {
  return (
    <div className={`accordion ${className || ''}`}>
      {children}
    </div>
  );
}

export function AccordionItem({ children, value }) {
  return (
    <div className="accordion-item" data-value={value}>
      {children}
    </div>
  );
}

export function AccordionTrigger({ children }) {
  return (
    <button className="accordion-trigger">
      {children}
    </button>
  );
}

export function AccordionContent({ children }) {
  return (
    <div className="accordion-content">
      {children}
    </div>
  );
}

// Ensure all components are exported
export default Accordion;
