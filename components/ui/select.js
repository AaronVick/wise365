//  /components/ui/select.js
import React from 'react';

const Select = ({ options, onChange, value }) => (
  <select value={value} onChange={onChange}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export default Select;
