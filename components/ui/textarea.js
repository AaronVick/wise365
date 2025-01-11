// components/ui/textarea.js

const Textarea = ({ value, onChange, placeholder }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full p-2 border rounded resize-none"
  />
);

export default Textarea;
