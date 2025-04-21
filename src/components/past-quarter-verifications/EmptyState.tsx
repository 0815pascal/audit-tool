import React from 'react';
import { EmptyState as CommonEmptyState } from '../common';

export const EmptyState: React.FC = () => (
  <CommonEmptyState 
    title="Past Quarter Verifications" 
    message="No verified invoices from past quarters." 
  />
); 