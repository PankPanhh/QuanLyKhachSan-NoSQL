import React from 'react';

function InputField({ 
  id, 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  defaultValue,
  required = false 
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}

export default InputField;
