import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TableSortLabel, InputAdornment, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import _debounce from 'lodash/debounce';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [itemCodes, setItemCodes] = useState([]);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [currentItemToEdit, setCurrentItemToEdit] = useState(null);
  const [editItemForm, setEditItemForm] = useState({ name: '', vendor: '', cost: '', condition: 'New', notes: '' });
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async (currentSearchTerm) => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (currentSearchTerm) {
        params.search = currentSearchTerm;
      }
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setInventory(response.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to fetch inventory!' });
    }
  };

  const debouncedFetchInventory = useCallback(_debounce(fetchInventory, 500), []);

  useEffect(() => {
    fetchInventory(searchTerm);
    fetchItemCodes();
  }, []);

  useEffect(() => {
    debouncedFetchInventory(searchTerm);
    return () => {
      debouncedFetchInventory.cancel();
    };
  }, [searchTerm, debouncedFetchInventory]);

  const fetchItemCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inventory/codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItemCodes(response.data);
    } catch (err) {
      console.error('Error fetching item codes:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to fetch item codes!' });
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleReceiveChange = (field) => (e) => {
    setReceiveForm({ ...receiveForm, [field]: e.target.value });
  };

  const handleCodeChange = (field) => (e) => {
    setCodeForm({ ...codeForm, [field]: e.target.value });
  };

  const handleReceiveSubmit = async () => {
    if (!receiveForm.itemName || !receiveForm.quantity || !receiveForm.itemCode || !receiveForm.size || !receiveForm.totalCost) {
      setAlertMessage({ type: 'error', text: 'All fields for receiving items are required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const costPerItem = parseFloat(receiveForm.totalCost) / parseInt(receiveForm.quantity);
      if (isNaN(costPerItem) || costPerItem <= 0) {
        setAlertMessage({ type: 'error', text: 'Invalid total cost or quantity, resulting in invalid cost per item.' });
        return;
      }
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
      fetchInventory(searchTerm);
    } catch (err) {
      console.error('Error receiving items:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to receive items!' });
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
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create item code!' });
    }
  };

  const handleRemoveItemSubmit = async () => {
    if (!removeBarcode) {
      setAlertMessage({ type: 'error', text: 'Barcode is required to identify the item for removal.' });
      setRemoveOpen(true); // Keep dialog open for barcode input
      return;
    }
    // This function is primarily for the 'Next' button in the dialog if barcode is not yet entered.
    // The actual removal is handled by handleConditionSelect.
    // If barcode is entered, the condition selection part of the dialog becomes visible.
    setRemoveOpen(true); 
  };

  const handleConditionSelect = async (condition) => {
    if (!removeBarcode) { // Should not happen if UI flow is correct
        setAlertMessage({ type: 'error', text: 'Barcode missing for removal.' });
        return;
    }
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
      fetchInventory(searchTerm);
    } catch (err) {
      console.error('Error removing item:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to remove item!' });
    }
  };

  const handleEditItemOpen = (item) => {
    setCurrentItemToEdit(item);
    setEditItemForm({
      name: item.name || '',
      vendor: item.vendor || '',
      cost: item.cost !== undefined ? String(item.cost) : '',
      condition: item.condition || 'New',
      notes: item.notes || ''
    });
    setEditItemOpen(true);
  };

  const handleEditItemChange = (field) => (e) => {
    setEditItemForm({ ...editItemForm, [field]: e.target.value });
  };

  const handleEditItemSubmit = async () => {
    if (!currentItemToEdit || !editItemForm.name || editItemForm.cost === '' || !editItemForm.condition) {
      setAlertMessage({ type: 'error', text: 'Name, Cost, and Condition are required for editing!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editItemForm.name,
        vendor: editItemForm.vendor,
        cost: parseFloat(editItemForm.cost),
        condition: editItemForm.condition,
        notes: editItemForm.notes,
      };
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${currentItemToEdit.barcode}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item updated successfully!' });
      setEditItemOpen(false);
      setCurrentItemToEdit(null);
      fetchInventory(searchTerm);
    } catch (err) {
      console.error('Error updating item:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update item!' });
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedInventory = useMemo(() => {
    let sortableInventory = [...inventory];
    if (sortConfig.key) {
      sortableInventory.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (aStr < bStr) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableInventory;
  }, [inventory, sortConfig]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Inventory Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={() => setReceiveOpen(true)} startIcon={<AddIcon />}>
              Receive New Items
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setCodeOpen(true)} startIcon={<AddIcon />}>
              Create Item Code
            </Button>
            <Button variant="contained" color="warning" onClick={() => { setRemoveBarcode(''); setRemoveNotes(''); setRemoveOpen(true); }} startIcon={<AddIcon />}>
              Remove Item
            </Button>
          </Box>
          <TextField
            label="Search Inventory"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: '300px' }}
          />
        </Box>

        <Typography variant="h6" gutterBottom>All Inventory Items</Typography>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={sortConfig.key === 'barcode'} direction={sortConfig.key === 'barcode' ? sortConfig.direction : 'asc'} onClick={() => requestSort('barcode')}>Barcode</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortConfig.key === 'name'} direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'} onClick={() => requestSort('name')}>Name</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortConfig.key === 'size'} direction={sortConfig.key === 'size' ? sortConfig.direction : 'asc'} onClick={() => requestSort('size')}>Size</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => requestSort('status')}>Status</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortConfig.key === 'condition'} direction={sortConfig.key === 'condition' ? sortConfig.direction : 'asc'} onClick={() => requestSort('condition')}>Condition</TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortConfig.key === 'cost'} direction={sortConfig.key === 'cost' ? sortConfig.direction : 'asc'} onClick={() => requestSort('cost')}>Cost</TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedInventory.map((item) => (
              <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.condition}</TableCell>
                <TableCell>${item.cost !== undefined && item.cost !== null ? item.cost.toFixed(2) : '0.00'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditItemOpen(item)} size="small" aria-label="edit">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Receive New Items Dialog */}
      <Dialog open={receiveOpen} onClose={() => setReceiveOpen(false)}>
        <DialogTitle>Receive New Items</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, width: '400px' }}>
            <TextField label="Item Name" value={receiveForm.itemName} onChange={handleReceiveChange('itemName')} variant="outlined" fullWidth />
            <TextField label="Quantity" type="number" value={receiveForm.quantity} onChange={handleReceiveChange('quantity')} variant="outlined" fullWidth />
            <TextField label="Vendor" value={receiveForm.vendor} onChange={handleReceiveChange('vendor')} variant="outlined" fullWidth />
            <TextField label="Total Invoice Cost ($)" type="number" value={receiveForm.totalCost} onChange={handleReceiveChange('totalCost')} variant="outlined" fullWidth />
            <TextField select label="Size" value={receiveForm.size} onChange={handleReceiveChange('size')} variant="outlined" fullWidth>
              {['SM', 'MD', 'LG', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', '9XL', '10XL'].map((size) => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Item Code" value={receiveForm.itemCode} onChange={handleReceiveChange('itemCode')} variant="outlined" fullWidth>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, width: '400px' }}>
            <TextField label="Item Name" value={codeForm.itemName} onChange={handleCodeChange('itemName')} variant="outlined" fullWidth />
            <TextField label="Item Type" value={codeForm.itemType} onChange={handleCodeChange('itemType')} variant="outlined" fullWidth />
            <TextField label="Two-Digit Code" value={codeForm.twoDigitCode} onChange={handleCodeChange('twoDigitCode')} variant="outlined" inputProps={{ maxLength: 2 }} fullWidth />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, width: '400px' }}>
            <TextField label="Barcode" value={removeBarcode} onChange={(e) => setRemoveBarcode(e.target.value)} variant="outlined" fullWidth />
            {removeBarcode && (
              <>
                <Typography>Select condition for item {removeBarcode}:</Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt:1 }}>
                  <Button variant="contained" color="primary" onClick={() => handleConditionSelect('Used')}>Used</Button>
                  <Button variant="contained" color="secondary" onClick={() => handleConditionSelect('Altered')}>Altered</Button>
                  <Button variant="contained" color="warning" onClick={() => handleConditionSelect('Damaged')}>Damaged</Button>
                </Box>
                <TextField label="Notes (optional)" value={removeNotes} onChange={(e) => setRemoveNotes(e.target.value)} multiline rows={2} variant="outlined" fullWidth sx={{mt:1}}/>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveOpen(false)}>Cancel</Button>
          {/* The 'Next' button is removed as condition selection appears once barcode is entered */}
          {/* Submission is handled by condition buttons if barcode is present */}
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editItemOpen} onClose={() => setEditItemOpen(false)}>
        <DialogTitle>Edit Inventory Item - {currentItemToEdit?.barcode}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, width: '400px' }}>
            <TextField label="Name" value={editItemForm.name} onChange={handleEditItemChange('name')} variant="outlined" fullWidth />
            <TextField label="Vendor" value={editItemForm.vendor} onChange={handleEditItemChange('vendor')} variant="outlined" fullWidth />
            <TextField label="Cost ($)" type="number" value={editItemForm.cost} onChange={handleEditItemChange('cost')} variant="outlined" fullWidth />
            <TextField select label="Condition" value={editItemForm.condition} onChange={handleEditItemChange('condition')} variant="outlined" fullWidth>
              {['New', 'Used', 'Altered', 'Damaged'].map((cond) => (
                <MenuItem key={cond} value={cond}>{cond}</MenuItem>
              ))}
            </TextField>
            <TextField label="Notes" value={editItemForm.notes} onChange={handleEditItemChange('notes')} variant="outlined" multiline rows={3} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItemOpen(false)}>Cancel</Button>
          <Button onClick={handleEditItemSubmit} color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default InventoryDashboard;

