// pages/laundry.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const LaundryDashboard = () => {
  const [laundryItems, setLaundryItems] = useState([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [returnInmateOpen, setReturnInmateOpen] = useState(false);
  const [returnInventoryOpen, setReturnInventoryOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);

  // Fetch laundry items on mount
  useEffect(() => {
    fetchLaundryItems();
  }, []);

  const fetchLaundryItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://jail-inventory-backend.herokuapp.com/laundry', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLaundryItems(response.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching laundry items:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch laundry items!' });
    }
  };

  const handleSendToLaundry = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://jail-inventory-backend.herokuapp.com/laundry/send', { barcode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item sent to laundry!' });
      setBarcode('');
      setSendOpen(false);
      fetchLaundryItems();
    } catch (err) {
      console.error('Error sending item to laundry:', err);
      setAlertMessage({ type: 'error', text: 'Failed to send item to laundry!' });
    }
  };

  const handleReturnToInmate = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://jail-inventory-backend.herokuapp.com/laundry/return-inmate', { barcode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item returned to inmate!' });
      setBarcode('');
      setReturnInmateOpen(false);
      fetchLaundryItems();
    } catch (err) {
      console.error('Error returning item to inmate:', err);
      setAlertMessage({ type: 'error', text: 'Failed to return item to inmate!' });
    }
  };

  const handleReturnToInventorySubmit = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required!' });
      return;
    }
    setSelectedBarcode(barcode);
    setBarcode('');
    setReturnInventoryOpen(false);
    setConditionOpen(true);  // Open condition dialog
  };

  const handleConditionSelect = async (condition) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://jail-inventory-backend.herokuapp.com/laundry/return-inventory', { barcode: selectedBarcode, condition }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item returned to inventory!' });
      setSelectedBarcode('');
      setConditionOpen(false);
      fetchLaundryItems();
    } catch (err) {
      console.error('Error returning item to inventory:', err);
      setAlertMessage({ type: 'error', text: 'Failed to return item to inventory!' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Laundry Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button variant="contained" color="primary" onClick={() => setSendOpen(true)} startIcon={<AddIcon />}>
            Send Item to Laundry
          </Button>
          <Button variant="contained" color="secondary" onClick={() => setReturnInmateOpen(true)} startIcon={<AddIcon />}>
            Return Item to Inmate
          </Button>
          <Button variant="contained" color="warning" onClick={() => setReturnInventoryOpen(true)} startIcon={<AddIcon />}>
            Return Item to Inventory
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>Items in Laundry</Typography>
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
            {laundryItems.map((item) => (
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

      {/* Send Item to Laundry Dialog */}
      <Dialog open={sendOpen} onClose={() => setSendOpen(false)}>
        <DialogTitle>Send Item to Laundry</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendOpen(false)}>Cancel</Button>
          <Button onClick={handleSendToLaundry} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Return Item to Inmate Dialog */}
      <Dialog open={returnInmateOpen} onClose={() => setReturnInmateOpen(false)}>
        <DialogTitle>Return Item to Inmate</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnInmateOpen(false)}>Cancel</Button>
          <Button onClick={handleReturnToInmate} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Return Item to Inventory Dialog - Barcode Entry */}
      <Dialog open={returnInventoryOpen} onClose={() => setReturnInventoryOpen(false)}>
        <DialogTitle>Return Item to Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnInventoryOpen(false)}>Cancel</Button>
          <Button onClick={handleReturnToInventorySubmit} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Condition Audit Dialog */}
      <Dialog open={conditionOpen} onClose={() => setConditionOpen(false)}>
        <DialogTitle>Select Item Condition</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography>Select the condition for item {selectedBarcode}:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={() => handleConditionSelect('Used')}>
                Used
              </Button>
              <Button variant="contained" color="secondary" onClick={() => handleConditionSelect('Altered')}>
                Altered
              </Button>
              <Button variant="contained" color="warning" onClick={() => handleConditionSelect('Damaged')}>
                Damaged
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConditionOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LaundryDashboard;