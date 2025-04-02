import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText, Typography, Box, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    { text: 'Inmates', path: '/inmates' },
    { text: 'Inventory', path: '/inventory' },
    { text: 'Laundry', path: '/laundry' },
    { text: 'Release', path: '/release' },
    { text: 'Reports', path: '/reports' },
    { text: 'Settings', path: '/settings' },
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/'); // Changed from '/login' to '/'
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Jail Inventory System
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          <List>
            {menuItems.map((item) => (
              <Link href={item.path} passHref key={item.text}>
                <ListItem button component="a">
                  <ListItemText primary={item.text} />
                </ListItem>
              </Link>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;