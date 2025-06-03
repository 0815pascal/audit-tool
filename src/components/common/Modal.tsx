import React from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div
      className="modal__overlay"
      onClick={onClose}
    >
      <dialog
        className="modal"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="modal__header flex justify-between items-center">
          <h3 id="modal-title" className="modal__title">{title}</h3>
          <button 
            onClick={onClose} 
            className="modal__close-button"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="modal__content">
          {children}
        </div>
      </dialog>
    </div>
  );
}; 