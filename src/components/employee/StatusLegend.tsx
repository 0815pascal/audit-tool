import React from 'react';

const StatusLegend: React.FC = () => {
  return (
    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '5px', textAlign: 'left', paddingLeft: '1.1rem' }}>
      🟢 = Verified &nbsp;<br/>  
      🟡 = Verified with errors &nbsp;<br/> 
      🔴 = Not verified &nbsp;<br/> 
      ⏳ = In progress
    </p>
  );
};

export default StatusLegend; 