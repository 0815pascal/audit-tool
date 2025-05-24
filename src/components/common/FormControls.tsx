import React from 'react';
import { SelectOption } from '../../types';
import { BUTTON_COLOR, BUTTON_SIZE, INPUT_TYPE_ENUM, UI_COLOR_ENUM } from '../../enums';

/**
 * Common form controls that can be reused across the application
 */

// Basic button component with configurable style
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  color?: BUTTON_COLOR;
  disabled?: boolean;
  size?: BUTTON_SIZE;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  color = BUTTON_COLOR.PRIMARY,
  disabled = false,
  size = BUTTON_SIZE.MEDIUM
}) => {
  // Color mapping
  const colorMap = {
    [BUTTON_COLOR.PRIMARY]: UI_COLOR_ENUM.PRIMARY,
    [BUTTON_COLOR.SUCCESS]: UI_COLOR_ENUM.SUCCESS,
    [BUTTON_COLOR.DANGER]: UI_COLOR_ENUM.DANGER,
    [BUTTON_COLOR.INFO]: UI_COLOR_ENUM.INFO,
    [BUTTON_COLOR.TEXT]: UI_COLOR_ENUM.TRANSPARENT
  };
  
  // Size mapping
  const sizeMap = {
    [BUTTON_SIZE.SMALL]: { padding: '6px 12px', fontSize: '0.9rem' },
    [BUTTON_SIZE.MEDIUM]: { padding: '8px 16px', fontSize: '1rem' },
    [BUTTON_SIZE.LARGE]: { padding: '10px 20px', fontSize: '1.1rem' }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: colorMap[color],
        color: color === BUTTON_COLOR.TEXT ? UI_COLOR_ENUM.PRIMARY : UI_COLOR_ENUM.WHITE,
        padding: sizeMap[size].padding,
        fontSize: sizeMap[size].fontSize,
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        fontWeight: 'bold'
      }}
    >
      {children}
    </button>
  );
};

// Label-value display for info sections
interface LabelValueProps {
  label: string;
  value: React.ReactNode;
}

export const LabelValue: React.FC<LabelValueProps> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
    <strong>{label}</strong>
    <span style={{ textAlign: 'right' }}>{value}</span>
  </div>
);

// Checkbox with label
interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false
}) => (
  <div className="checkbox-container">
    <input
      type={INPUT_TYPE_ENUM.CHECKBOX}
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <label htmlFor={id} style={{ 
      textAlign: 'left', 
      fontSize: '14px',
      fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif'
    }}>{label}</label>
  </div>
);

// Text area with label
interface TextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3
}) => (
  <div>
    <label style={{ display: 'flex', marginLeft: '.5rem' }} htmlFor={id}>{label}</label>
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
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  centerTitle?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '',
  fullWidth = false,
  centerTitle = false
}) => (
  <div className={`card ${className}`} style={{ width: fullWidth ? '100%' : 'auto' }}>
    {title && <h2 className={centerTitle ? "text-center" : "text-left"}>{title}</h2>}
    {children}
  </div>
);

// Select dropdown component
interface SelectProps<T = string> {
  id: string;
  label?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

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
    <div style={{ display: 'flex', flexDirection: 'column', marginRight: '1rem' }}>
      {label && <label htmlFor={id} style={{ marginBottom: '0.25rem' }}>{label}</label>}
      <select
        id={id}
        value={value}
        onChange={handleChange}
        style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${UI_COLOR_ENUM.BORDER}` }}
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