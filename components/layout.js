import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/router';

const Layout = ({ children }) => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Sentinel Inventory System
          </Typography>
          <Button color="inherit" onClick={() => router.push('/inmates')}>
            Inmates
          </Button>
          <Button color="inherit" onClick={() => router.push('/inventory')}>
            Inventory
          </Button>
          <Button color="inherit" onClick={() => router.push('/laundry')}>
            Laundry
          </Button>
          <Button color="inherit" onClick={() => router.push('/release')}>
            Release
          </Button>
          <Button color="inherit" onClick={() => router.push('/reports')}>
            Reports
          </Button>
          <Button color="inherit" onClick={() => router.push('/settings')}>
            Settings
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;