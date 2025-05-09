import React from 'react';
import { tableHeaderStyle, headerRowStyle } from '../common';

export const PastQuarterVerificationsTableHeader: React.FC = () => {
  return (
    <thead>
      <tr style={headerRowStyle}>
        <th style={tableHeaderStyle}>Quarter</th>
        <th style={tableHeaderStyle}>Case</th>
        <th style={tableHeaderStyle}>Client</th>
        <th style={tableHeaderStyle}>Policy</th>
        <th style={tableHeaderStyle}>Dossier</th>
        <th style={tableHeaderStyle}>Employee</th>
        <th style={tableHeaderStyle}>Amount</th>
        <th style={tableHeaderStyle}>Progress</th>
        <th style={tableHeaderStyle}>Date</th>
      </tr>
    </thead>
  );
}; 