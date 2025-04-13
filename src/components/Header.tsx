import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{ 
      backgroundColor: 'var(--primary-color)', 
      color: 'white',
      padding: '1rem',
      marginBottom: '2rem'
    }}>
      <div className="container">
        <h1 style={{ margin: 0, color: 'white' }}>CARA IKS</h1>
      </div>
    </header>
  );
};

export default Header; 