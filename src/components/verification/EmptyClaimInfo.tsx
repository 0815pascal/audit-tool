import React from 'react';
import { Card } from '../common';

const EmptyClaimInfo: React.FC = () => {
  return (
    <Card title="Claim Information">
      <p className="text-left">Select an employee from the right panel to begin verification.</p>
    </Card>
  );
};

export default EmptyClaimInfo; 