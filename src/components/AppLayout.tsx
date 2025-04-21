import React from 'react';
import { Box, Container, Typography } from '@mui/material';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="header" sx={{ py: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Container>
          <Typography variant="h5" component="h1">
            Audit Tool
          </Typography>
        </Container>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container>
          {children}
        </Container>
      </Box>
    </Box>
  );
}; 