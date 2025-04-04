import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [itemCodes, setItemCodes] = useState([]);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeBarcode, setRemoveBarcode] = useState('');
  const [removeCondition, setRemoveCondition] = useState('');
  const [removeNotes, setRemoveNotes] = useState('');
  const [receiveForm, setReceiveForm] = useState({
    itemName: '',
    quantity: '',
    vendor: '',
    totalCost: '',
    size: '',
    itemCode: ''
  });
  const [codeForm, setCodeForm] = useState({
    itemName: '',
    itemType: '',
    twoDigitCode: ''
  });
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    fetchInventory();
    fetchItemCodes();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch inventory!' });
    }
  };

  const fetchItemCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inventory/codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItemCodes(response.data);
    } catch (err) {
      console.error('Error fetching item codes:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch item codes!' });
    }
  };

  const handleReceiveChange = (field) => (e) => {
    setReceiveForm({ ...receiveForm, [field]: e.target.value });
  };

  const handleCodeChange = (field) => (e) => {
    setCodeForm({ ...codeForm, [field]: e.target.value });
  };

  const handleReceiveSubmit = async () => {
    if (!receiveForm.itemName || !receiveForm.quantity || !receiveForm.itemCode || !receiveForm.size) {
      setAlertMessage({ type: 'error', text: 'Item Name, Quantity, Item Code, and Size are required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const costPerItem = parseFloat(receiveForm.totalCost) / parseInt(receiveForm.quantity);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/inventory/bulk`, {
        item_code: receiveForm.itemCode,
        size_code: receiveForm.size,
        quantity: parseInt(receiveForm.quantity),
        name: receiveForm.itemName,
        cost: costPerItem,
        vendor: receiveForm.vendor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Items received successfully!' });
      setReceiveForm({ itemName: '', quantity: '', vendor: '', totalCost: '', size: '', itemCode: '' });
      setReceiveOpen(false);
      fetchInventory();
    } catch (err) {
      console.error('Error receiving items:', err);
      setAlertMessage({ type: 'error', text: 'Failed to receive items!' });
    }
  };

  const handleCodeSubmit = async () => {
    if (!codeForm.itemName || !codeForm.itemType || !codeForm.twoDigitCode) {
      setAlertMessage({ type: 'error', text: 'Item Name, Item Type, and Two-Digit Code are required!' });
      return;
    }
    if (!/^[A-Za-z0-9]{2}$/.test(codeForm.twoDigitCode)) {
      setAlertMessage({ type: 'error', text: 'Two-Digit Code must be exactly 2 alphanumeric characters!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/inventory/codes`, {
        name: codeForm.itemName,
        type: codeForm.itemType,
        code: codeForm.twoDigitCode.toUpperCase()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item code created successfully!' });
      setCodeForm({ itemName: '', itemType: '', twoDigitCode: '' });
      setCodeOpen(false);
      fetchItemCodes();
    } catch (err) {
      console.error('Error creating item code:', err);
      setAlertMessage({ type: 'error', text: 'Failed to create item code!' });
    }
  };

  const handleRemoveItemSubmit = async () => {
    if (!removeBarcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required!' });
      return;
    }
    setRemoveOpen(true); // Open condition/notes dialog
  };

  const handleConditionSelect = async (condition) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/inventory/remove`, {
        barcode: removeBarcode,
        condition,
        notes: removeNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item removed successfully!' });
      setRemoveBarcode('');
      setRemoveCondition('');
      setRemoveNotes('');
      setRemoveOpen(false);
      fetchInventory();
    } catch (err) {
      console.error('Error removing item:', err);
      setAlertMessage({ type: 'error', text: 'Failed to remove item!' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Inventory Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button variant="contained" color="primary" onClick={() => setReceiveOpen(true)} startIcon={<AddIcon />}>
            Receive New Items
          </Button>
          <Button variant="contained" color="secondary" onClick={() => setCodeOpen(true)} startIcon={<AddIcon />}>
            Create Item Code
          </Button>
          <Button variant="contained" color="warning" onClick={() => setRemoveOpen(true)} startIcon={<AddIcon />}>
            Remove Item
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>All Inventory Items</Typography>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Barcode</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.condition}</TableCell>
                <TableCell>${item.cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Receive New Items Dialog */}
      <Dialog open={receiveOpen} onClose={() => setReceiveOpen(false)}>
        <DialogTitle>Receive New Items</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Item Name" value={receiveForm.itemName} onChange={handleReceiveChange('itemName')} variant="outlined" />
            <TextField label="Quantity" type="number" value={receiveForm.quantity} onChange={handleReceiveChange('quantity')} variant="outlined" />
            <TextField label="Vendor" value={receiveForm.vendor} onChange={handleReceiveChange('vendor')} variant="outlined" />
            <TextField label="Total Invoice Cost ($)" type="number" value={receiveForm.totalCost} onChange={handleReceiveChange('totalCost')} variant="outlined" />
            <TextField
              select
              label="Size"
              value={receiveForm.size}
              onChange={handleReceiveChange('size')}
              variant="outlined"
            >
              {['SM', 'MD', 'LG', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL'].map((size) => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Item Code"
              value={receiveForm.itemCode}
              onChange={handleReceiveChange('itemCode')}
              variant="outlined"
            >
              {itemCodes.map((code) => (
                <MenuItem key={code.code} value={code.code}>{`${code.name} (${code.code})`}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiveOpen(false)}>Cancel</Button>
          <Button onClick={handleReceiveSubmit} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Create Item Code Dialog */}
      <Dialog open={codeOpen} onClose={() => setCodeOpen(false)}>
        <DialogTitle>Create Item Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Item Name" value={codeForm.itemName} onChange={handleCodeChange('itemName')} variant="outlined" />
            <TextField label="Item Type" value={codeForm.itemType} onChange={handleCodeChange('itemType')} variant="outlined" />
            <TextField label="Two-Digit Code" value={codeForm.twoDigitCode} onChange={handleCodeChange('twoDigitCode')} variant="outlined" inputProps={{ maxLength: 2 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeOpen(false)}>Cancel</Button>
          <Button onClick={handleCodeSubmit} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Item Dialog */}
      <Dialog open={removeOpen} onClose={() => setRemoveOpen(false)}>
        <DialogTitle>Remove Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Barcode"
              value={removeBarcode}
              onChange={(e) => setRemoveBarcode(e.target.value)}
              variant="outlined"
            />
            {removeBarcode && (
              <>
                <Typography>Select condition for item {removeBarcode}:</Typography>
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
                <TextField
                  label="Notes (optional)"
                  value={removeNotes}
                  onChange={(e) => setRemoveNotes(e.target.value)}
                  multiline
                  rows={2}
                  variant="outlined"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveOpen(false)}>Cancel</Button>
          {!removeBarcode && <Button onClick={handleRemoveItemSubmit} color="primary">Next</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryDashboard;