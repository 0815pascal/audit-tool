import React from 'react';

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
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '4px',
          width: '600px',
          maxHeight: '90vh',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Fixed Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: 'white',
          borderRadius: '4px 4px 0 0',
          position: 'sticky',
          top: 0,
          zIndex: 1001
        }}>
          <h3 id="modal-title" style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ 
            fontSize: '1.5rem', 
            lineHeight: 1, 
            border: 'none', 
            background: 'transparent', 
            cursor: 'pointer', 
            color: '#333',
            padding: '4px 8px'
          }}>
            &times;
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div style={{
          padding: '1rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}; 