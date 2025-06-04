import React from 'react';

/**
 * Props interface for the Modal component
 */
export interface ModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
} 