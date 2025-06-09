import React, { useState } from 'react';
import Drawer from './Drawer';
import { DebugControls } from './DebugControls';
import './DebugDrawer.css';

/**
 * Debug Drawer Component - A collapsible drawer containing debug controls
 * Triggered by a cog-wheel button positioned on the right side
 */
const DebugDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        className="debug-drawer__trigger"
        onClick={handleOpen}
        title="Open Debug Controls"
        aria-label="Open Debug Controls"
      >
        ⚙️
      </button>

      {/* Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={handleClose}
        title="Debug Controls"
        width="400px"
        position="right"
      >
        <div className="debug-drawer__content-wrapper">
          <DebugControls />
        </div>
      </Drawer>
    </>
  );
};

export default DebugDrawer; 