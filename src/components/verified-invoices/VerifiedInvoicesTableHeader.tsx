import React from 'react';
import { tableHeaderStyle } from './styles';

export const VerifiedInvoicesTableHeader: React.FC = () => (
  <thead>
    <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Quarter</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Case</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Client</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Policy</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Dossier</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Employee</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Amount</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Progress</th>
      <th style={{...tableHeaderStyle, textAlign: 'left'}} align="left">Date</th>
    </tr>
  </thead>
); 