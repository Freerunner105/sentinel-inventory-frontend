import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const InmateDetail = () => {
  const [inmate, setInmate] = useState(null);
  const [items, setItems] = useState([]);
  const [barcode, setBarcode] = useState('');
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
      const response = await axios.get(`http://localhost:5000/inmates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inmateData = response.data.find(i => i.id === id);
      if (!inmateData) throw new Error('Inmate not found');
      setInmate(inmateData);
    } catch (err) {
      console.error('Error fetching inmate:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch inmate!' });
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/inmates/${id}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch items!' });
    }
  };

  const handleAssignItem = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/inmates/${id}/items`, { barcode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item assigned successfully!' });
      setBarcode('');
      fetchItems();
    } catch (err) {
      console.error('Error assigning item:', err);
      setAlertMessage({ type: 'error', text: 'Failed to assign item!' });
    }
  };

  if (!inmate) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Inmate: {inmate.name} (ID: {inmate.id})</Typography>
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

        <Typography variant="h6" gutterBottom>Assign Items</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            variant="outlined"
            fullWidth
          />
          <Button variant="contained" color="primary" onClick={handleAssignItem} startIcon={<AddIcon />}>
            Assign Item
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>Assigned Items</Typography>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Barcode</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>{item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default InmateDetail;