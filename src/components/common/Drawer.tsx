import React from 'react';
import './Drawer.css';

interface DrawerProps {
  /** Whether the drawer is open/visible */
  isOpen: boolean;
  /** Callback function called when the drawer should be closed */
  onClose: () => void;
  /** Title displayed in the drawer header */
  title: string;
  /** Content to render inside the drawer */
  children: React.ReactNode;
  /** Width of the drawer (default: '400px') */
  width?: string;
  /** Position of the drawer (default: 'right') */
  position?: 'left' | 'right';
}

/**
 * Generic Drawer Component
 * 
 * A reusable sliding drawer component that can be positioned on the left or right side
 * of the screen. Features include:
 * - Overlay background with click-to-close
 * - Smooth slide animations
 * - Consistent close button styling
 * - Mobile responsive behavior
 * - Customizable width and position
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * return (
 *   <Drawer
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Settings"
 *     width="500px"
 *     position="right"
 *   >
 *     <YourContent />
 *   </Drawer>
 * );
 * ```
 */
const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '400px',
  position = 'right'
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay - only render when open */}
      {isOpen && (
        <div className="drawer__overlay" onClick={handleOverlayClick} />
      )}
      
      {/* Drawer - always render for transitions */}
      <div 
        className={`drawer drawer--${position} ${isOpen ? 'drawer--open' : ''}`}
        style={{ width }}
      >
        {/* Header */}
        <div className="drawer__header">
          <h3 className="drawer__title">{title}</h3>
          <button
            className="modal__close-button"
            onClick={onClose}
            aria-label="Close drawer"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="drawer__content">
          {children}
        </div>
      </div>
    </>
  );
};

export default Drawer; 