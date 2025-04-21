import React from 'react';

export const tableHeaderStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  verticalAlign: 'top',
  fontWeight: 'bold',
  borderBottom: '2px solid var(--border-color)'
};

export const tableCellStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left !important' as React.CSSProperties["textAlign"],
  verticalAlign: 'top',
  borderBottom: '1px solid var(--border-color)'
}; 