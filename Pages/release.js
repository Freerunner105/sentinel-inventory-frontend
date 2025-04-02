// pages/release.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/router';
import axios from 'axios';

const ReleaseDashboard = () => {
  const [inmates, setInmates] = useState([]);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchInmates();
  }, []);

  const fetchInmates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/inmates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inmatesWithDetails = await Promise.all(response.data.map(async (inmate) => {
        const itemsResponse = await axios.get(`http://localhost:5000/inmates/${inmate.id}/items`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const feesResponse = await axios.get(`http://localhost:5000/inmates/${inmate.id}/fees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return {
          ...inmate,
          assignedItems: itemsResponse.data.map(item => item.name).join(', '),
          totalFees: feesResponse.data.reduce((sum, fee) => sum + fee.amount, 0)
        };
      }));
      setInmates(inmatesWithDetails);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching inmates:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch inmates!' });
    }
  };

  const handleReleaseSubmit = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Inmate ID is required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/inmates/${barcode}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.length > 0) {
        setAlertMessage({ type: 'error', text: 'Cannot release inmate with assigned items!' });
        return;
      }
      router.push(`/release/${barcode}`);
      setBarcode('');
      setReleaseOpen(false);
    } catch (err) {
      console.error('Error checking inmate items:', err);
      setAlertMessage({ type: 'error', text: 'Failed to check inmate items!' });
    }
  };

  const handleReturnToInventorySubmit = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required!' });
      return;
    }
    setSelectedBarcode(barcode);
    setBarcode('');
    setReturnOpen(false);
    setConditionOpen(true);
  };

  const handleConditionSelect = async (condition) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/laundry/return-inventory', { barcode: selectedBarcode, condition }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item returned to inventory!' });
      setSelectedBarcode('');
      setConditionOpen(false);
      fetchInmates();
    } catch (err) {
      console.error('Error returning item to inventory:', err);
      setAlertMessage({ type: 'error', text: 'Failed to return item to inventory!' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Release Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button variant="contained" color="primary" onClick={() => setReleaseOpen(true)} startIcon={<AddIcon />}>
            Release Inmate
          </Button>
          <Button variant="contained" color="warning" onClick={() => setReturnOpen(true)} startIcon={<AddIcon />}>
            Return Item to Inventory
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>All Inmates</Typography>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Inmate ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Housing Unit</TableCell>
              <TableCell>Total Fees</TableCell>
              <TableCell>Assigned Items</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inmates.map((inmate) => (
              <TableRow key={inmate.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                <TableCell>{inmate.id}</TableCell>
                <TableCell>{inmate.name}</TableCell>
                <TableCell>{inmate.housing_unit}</TableCell>
                <TableCell>${inmate.totalFees.toFixed(2)}</TableCell>
                <TableCell>{inmate.assignedItems || 'None'}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => router.push(`/release/${inmate.id}`)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Release Inmate Dialog */}
      <Dialog open={releaseOpen} onClose={() => setReleaseOpen(false)}>
        <DialogTitle>Release Inmate</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Inmate ID" value={barcode} onChange={(e) => setBarcode(e.target.value)} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseOpen(false)}>Cancel</Button>
          <Button onClick={handleReleaseSubmit} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Return Item to Inventory Dialog - Barcode Entry */}
      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)}>
        <DialogTitle>Return Item to Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnOpen(false)}>Cancel</Button>
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

export default ReleaseDashboard;