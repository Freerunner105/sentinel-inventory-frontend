import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Fade, Alert } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import axios from 'axios';
import { useRouter } from 'next/router';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/inmates');
    }
  }, [router]);

const handleLogin = async () => {
  try {
    console.log('API URL being used:', process.env.NEXT_PUBLIC_API_URL);
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/login`, { username, password });
    localStorage.setItem('token', response.data.token);
    setAlertMessage({ type: 'success', text: 'Login successful!' });
    setIsLoggedIn(true);
  } catch (err) {
    console.error('Login error:', err);
    setAlertMessage({ type: 'error', text: 'Invalid credentials!' });
  }
};

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/inmates');
    }
  }, [isLoggedIn, router]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Fade in={true} timeout={500}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" gutterBottom align="center" sx={{ color: 'text.primary', fontWeight: 600 }}>
            Sentinel Inventory Login
          </Typography>
          <Typography variant="body2" align="center" sx={{ color: 'text.secondary', mb: 3 }}>
            Please enter your credentials to access the system
          </Typography>
          {alertMessage && (
            <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
              {alertMessage.text}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onKeyPress={handleKeyPress}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              variant="outlined"
            />
            <Button variant="contained" color="primary" onClick={handleLogin} fullWidth sx={{ py: 1.5 }}>
              Sign In
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default Login;