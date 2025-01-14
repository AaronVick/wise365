// components/Accordion.js
import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import classNames from 'classnames';

export function Accordion({ children, type = "single", collapsible = false, className, ...props }) {
  return (
    <AccordionPrimitive.Root
      type={type}
      collapsible={collapsible}
      className={className}
      {...props}
    >
      {children}
    </AccordionPrimitive.Root>
  );
}

export function AccordionItem({ children, className, ...props }) {
  return (
    <AccordionPrimitive.Item
      className={classNames('border-b', className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Item>
  );
}

export function AccordionTrigger({ children, className, ...props }) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={classNames(
          'flex flex-1 items-center justify-between py-4 px-4 text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ children, className, ...props }) {
  return (
    <AccordionPrimitive.Content
      className={classNames(
        'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0">
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}