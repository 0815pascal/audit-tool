import React from 'react';
import { EmptyState as CommonEmptyState } from '../common';

export const EmptyState: React.FC<{insideCard?: boolean}> = ({insideCard = false}) => 
  insideCard ? (
    <p className="text-left">No verified invoices from past quarters.</p>
  ) : (
    <CommonEmptyState 
      title="Past Quarter Verifications" 
      message="No verified invoices from past quarters." 
    />
  ); 