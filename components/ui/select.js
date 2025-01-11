const Select = ({ options, onChange, value }) => (
  <select value={value} onChange={onChange} className="w-full p-2 border rounded">
    {options.map((option, i) => (
      <option key={i} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export { Select, Select as SelectItem };
export default Select;
