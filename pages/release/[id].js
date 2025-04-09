import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const InmateDetail = () => {
  const [inmate, setInmate] = useState(null);
  const [items, setItems] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  // Fetch inmate details and items when the component mounts or ID changes
  useEffect(() => {
    if (id) {
      fetchInmate();
      fetchItems();
    }
  }, [id]);

  const fetchInmate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${id}`, {
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${id}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch items!' });
    }
  };

  // Handle assigning a new item to the inmate
  const handleAssignItem = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${id}/items`, { barcode }, {
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

  // Handle releasing the inmate
  const handleReleaseInmate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/release/${inmate.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Inmate released successfully!' });
      setReleaseConfirmOpen(false);
      setTimeout(() => router.push('/release'), 1000); // Redirect to Release Dashboard
    } catch (err) {
      console.error('Error releasing inmate:', err);
      setAlertMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to release inmate!',
      });
      setReleaseConfirmOpen(false);
    }
  };

  // Show loading state if inmate data is not yet fetched
  if (!inmate) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Inmate Header */}
      <Typography variant="h4" gutterBottom color="primary">
        Inmate: {inmate.name} (ID: {inmate.id})
      </Typography>

      {/* Alert Messages */}
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Inmate Details */}
        <Typography variant="h6" gutterBottom>Details</Typography>
        <Box sx={{ mb: 3 }}>
          <Typography>Housing Unit: {inmate.housing_unit}</Typography>
          <Typography>Fees Paid: ${inmate.fees_paid.toFixed(2)}</Typography>
          <Typography>Notes: {inmate.notes || 'N/A'}</Typography>
        </Box>

        {/* Assign Items Section */}
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

        {/* Assigned Items Table */}
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

        {/* Release Inmate Button with Tooltip */}
        <Tooltip title={items.length > 0 ? "Cannot release inmate with assigned items" : ""}>
          <span>
            <Button
              variant="contained"
              color="error"
              onClick={() => setReleaseConfirmOpen(true)}
              disabled={items.length > 0}
              sx={{ mt: 3 }}
            >
              Release Inmate
            </Button>
          </span>
        </Tooltip>
      </Paper>

      {/* Release Confirmation Dialog */}
      <Dialog open={releaseConfirmOpen} onClose={() => setReleaseConfirmOpen(false)}>
        <DialogTitle>Confirm Release</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to release this inmate? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleReleaseInmate} color="error">Release</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InmateDetail;