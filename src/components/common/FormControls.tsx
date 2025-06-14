import React from 'react';
import './FormControls.css';
import { BUTTON_COLOR, BUTTON_SIZE, INPUT_TYPE_ENUM } from '../../enums';
import { ButtonProps, CheckboxProps, TextAreaProps, CardProps, SelectProps } from './FormControls.types';

/**
 * Common form controls that can be reused across the application
 */

// Basic button component with configurable style
export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  color = BUTTON_COLOR.PRIMARY,
  disabled = false,
  size = BUTTON_SIZE.MEDIUM
}) => {
  const baseClass = 'button';
  const colorClass = `button--${color}`;
  const sizeClass = `button--${size}`;
  const disabledClass = disabled ? 'button--disabled' : '';
  
  // Add utility classes for color variants
  const utilityClasses = [];
  if (color !== BUTTON_COLOR.TEXT) {
    utilityClasses.push(`bg-${color}`, 'text-white');
  }
  
  const className = [baseClass, colorClass, sizeClass, disabledClass, ...utilityClasses].filter(Boolean).join(' ');
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};

// Checkbox with label
export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false
}) => (
  <div className="checkbox-container flex items-center gap-md mb-2">
    <input
      type={INPUT_TYPE_ENUM.CHECKBOX}
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <label htmlFor={id} className="checkbox__label text-left text-sm m-0">{label}</label>
  </div>
);

// Text area with label
export const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3
}) => (
  <div className="form-field mb-4">
   {label && <label className="form-field__label flex font-medium p-md mb-4" htmlFor={id}>{label}</label>}
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  </div>
);

// Card container component
export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '',
  fullWidth = false,
  centerTitle = false
}) => {
  const widthClass = fullWidth ? 'card--full-width w-100' : 'card--auto-width w-auto';
  const cardClassName = `card ${widthClass} ${className}`.trim();
  
  return (
    <div className={cardClassName}>
    {title && <h2 className={centerTitle ? "text-center" : "text-left"}>{title}</h2>}
    {children}
  </div>
);
};

// Select dropdown component
export const Select = <T extends string>({
  id,
  label,
  options,
  value,
  onChange
}: SelectProps<T>) => {
  // Use type assertion since we know our onChange will handle the proper conversion
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as T);
  };
  
  return (
    <div className="select-field flex flex-col">
      {label && <label htmlFor={id} className="select-field__label mb-0 font-medium">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={handleChange}
        className="select-field__control"
      >
        <option value="">-- Select --</option>
        {options.map(opt => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}; 