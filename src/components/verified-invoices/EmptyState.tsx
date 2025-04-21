import React from 'react';
import { EmptyState as CommonEmptyState } from '../common';

export const EmptyState: React.FC = () => (
  <CommonEmptyState 
    title="Verified Invoices" 
    message="No invoices have been verified yet." 
  />
); 