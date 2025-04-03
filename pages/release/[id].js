import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import axios from 'axios';

const ReleaseDetail = () => {
  const [inmate, setInmate] = useState(null);
  const [items, setItems] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchInmate();
      fetchItems();
    }
  }, [id]);

  const fetchInmate = async () => {
    try {
      const token = localStorage.getItem('token');
<<<<<<< HEAD:Pages/release/[id].js
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${id}`, {
=======
      const response = await axios.get(`https://jail-inventory-backend-3e76c7915903.herokuapp.com/inmates`, {
>>>>>>> f6f110db7d2bf72928b3b68a6d3c5cac9cc1fa70:pages/release/[id].js
        headers: { Authorization: `Bearer ${token}` }
      });
      setInmate(response.data);
    } catch (err) {
      console.error('Error fetching inmate:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch inmate!' });
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
<<<<<<< HEAD:Pages/release/[id].js
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${id}/items`, {
=======
      const response = await axios.get(`https://jail-inventory-backend-3e76c7915903.herokuapp.com/inmates/${id}/items`, {
>>>>>>> f6f110db7d2bf72928b3b68a6d3c5cac9cc1fa70:pages/release/[id].js
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch items!' });
    }
  };

  const handleRelease = async () => {
    try {
      const token = localStorage.getItem('token');
<<<<<<< HEAD:Pages/release/[id].js
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/release/${id}`, {}, {
=======
      await axios.post(`https://jail-inventory-backend-3e76c7915903.herokuapp.com/release/${id}`, {}, {
>>>>>>> f6f110db7d2bf72928b3b68a6d3c5cac9cc1fa70:pages/release/[id].js
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Inmate released successfully!' });
      setTimeout(() => router.push('/release'), 1000);
    } catch (err) {
      console.error('Error releasing inmate:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to release inmate!' });
    }
  };

  if (!inmate) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Release Inmate: {inmate.name} (ID: {inmate.id})</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Details</Typography>
        <Box sx={{ mb: 3 }}>
          <Typography>Housing Unit: {inmate.housing_unit}</Typography>
          <Typography>Fees Paid: ${inmate.fees_paid.toFixed(2)}</Typography>
          <Typography>Notes: {inmate.notes || 'N/A'}</Typography>
        </Box>
        <Typography variant="h6" gutterBottom>Assigned Items</Typography>
        {items.length > 0 ? (
          <Typography color="error">Cannot release inmate with assigned items.</Typography>
        ) : (
          <Button variant="contained" color="primary" onClick={handleRelease}>
            Confirm Release
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default ReleaseDetail;