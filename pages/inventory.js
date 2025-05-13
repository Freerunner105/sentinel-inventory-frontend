import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TableSortLabel, InputAdornment, IconButton } from '@mui/material'; // Added IconButton
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit'; // Added EditIcon
import axios from 'axios';
import _debounce from 'lodash/debounce';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [itemCodes, setItemCodes] = useState([]);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false); // State for edit item dialog
  const [currentItemToEdit, setCurrentItemToEdit] = useState(null); // State for item being edited
  const [editItemForm, setEditItemForm] = useState({ name: '', vendor: '', cost: '', condition: '', notes: '' }); // State for edit item form
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
      setAlertMessage({ type: 'error', text: 'Barcode is required to remove an item!' });
      // Keep removeOpen true to allow user to enter barcode if they clicked Remove Item button first
      return;
    }
    // If barcode is present, proceed to condition selection (which is part of the same dialog now)
    // The dialog should already be open if this function is called from a button within it.
    // If called from the main 
