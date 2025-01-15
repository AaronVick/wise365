// components/toolComponents/FormChatButton.js

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';

const FormChatButton = ({ isOpen, onClick, className = '' }) => {
  return (
    <Button
      onClick={onClick}
      className={`fixed bottom-4 right-4 rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out ${className}`}
      variant="default"
    >
      <MessageSquare className="h-6 w-6" />
      <span className="ml-2">{isOpen ? 'Close Help' : 'Ask for Help'}</span>
    </Button>
  );
};

export default FormChatButton;