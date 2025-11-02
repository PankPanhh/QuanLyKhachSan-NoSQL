import React from 'react';

function InputField({ 
  id, 
  name,
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  defaultValue,
  required = false,
  rows = 3,
  disabled = false,
  className = ''
}) {
  return (
    <div className="mb-3">
      {label && <label htmlFor={id || name} className="form-label">{label}</label>}
      {type === 'textarea' ? (
        <textarea
          id={id || name}
          name={name}
          className={`form-control ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          required={required}
          rows={rows}
          disabled={disabled}
        />
      ) : (
        <input
          type={type}
          name={name}
          className={`form-control ${className}`}
          id={id || name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export default InputField;
