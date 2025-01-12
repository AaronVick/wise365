// components/DynamicComponent.js


import React from 'react';

const DynamicComponent = ({ message }) => {
  return (
    <div className="border-2 border-gray-300 p-4 rounded-lg bg-gray-100 text-center">
      <h2 className="text-xl font-bold text-gray-800">Dynamic Component</h2>
      <p className="text-gray-600">{message || "This is a dynamically loaded component!"}</p>
    </div>
  );
};

export default DynamicComponent;

