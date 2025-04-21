import React from 'react';

/**
 * Common form controls that can be reused across the application
 */

// Basic button component with configurable style
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  color?: 'primary' | 'success' | 'danger' | 'info';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  color = 'primary',
  disabled = false,
  size = 'medium'
}) => {
  // Color mapping
  const colorMap = {
    primary: 'var(--primary-color)',
    success: 'var(--success-color)',
    danger: '#d24723',
    info: '#00008f'
  };
  
  // Size mapping
  const sizeMap = {
    small: { padding: '6px 12px', fontSize: '0.9rem' },
    medium: { padding: '8px 16px', fontSize: '1rem' },
    large: { padding: '10px 20px', fontSize: '1.1rem' }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: colorMap[color],
        color: 'white',
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
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    <label htmlFor={id}>{label}</label>
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