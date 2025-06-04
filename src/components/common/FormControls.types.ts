import React from 'react';
import { SelectOption } from '../../types/types';
import { BUTTON_COLOR, BUTTON_SIZE } from '../../enums';

/**
 * Props interface for the Button component
 */
export interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  color?: BUTTON_COLOR;
  disabled?: boolean;
  size?: BUTTON_SIZE;
}

/**
 * Props interface for the Checkbox component
 */
export interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

/**
 * Props interface for the TextArea component
 */
export interface TextAreaProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * Props interface for the Card component
 */
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  centerTitle?: boolean;
}

/**
 * Props interface for the Select component
 */
export interface SelectProps<T = string> {
  id: string;
  label?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
} 