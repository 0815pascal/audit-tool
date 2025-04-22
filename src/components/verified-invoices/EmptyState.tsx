import React from 'react';
import { EmptyState as CommonEmptyState } from '../common';

export const EmptyState: React.FC<{insideCard?: boolean}> = ({insideCard = false}) => 
  insideCard ? (
    <p className="text-left">No invoices have been verified yet.</p>
  ) : (
    <CommonEmptyState 
      title="Verified Invoices" 
      message="No invoices have been verified yet." 
    />
  ); 