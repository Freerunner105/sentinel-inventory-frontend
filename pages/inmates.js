import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, TableSortLabel, IconButton } from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit'; // Import EditIcon

const InmatesDashboard = () => {
  const [inmates, setInmates] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false); // State for edit dialog
  const [currentInmate, setCurrentInmate] = useState(null); // State for inmate being edited
  const [editFormData, setEditFormData] = useState({ housing_unit: '', notes: '' }); // State for edit form data
  const [inmateId, setInmateId] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const router = useRouter();

  useEffect(() => {
    fetchInmates();
  }, []);

  const fetchInmates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/'); // Redirect to login if no token
        return;
      }
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInmates(response.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching inmates:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token'); // Clear invalid token
        router.push('/'); // Redirect to login
        setAlertMessage({ type: 'error', text: 'Session expired. Please log in again.' });
      } else {
        setAlertMessage({ type: 'error', text: 'Failed to fetch inmates!' });
      }
    }
  };

  const handleAddInmate = () => {
    router.push('/inmates/add');
  };

  const handleAssignItems = () => {
    if (!inmateId) {
      setAlertMessage({ type: 'error', text: 'Inmate ID is required!' });
      return;
    }
    router.push(`/inmates/${inmateId}`);
    setAssignOpen(false);
    setInmateId('');
  };

  const handleOpenEditDialog = (inmate) => {
    setCurrentInmate(inmate);
    setEditFormData({ housing_unit: inmate.housing_unit || '', notes: inmate.notes || '' });
    setEditOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditOpen(false);
    setCurrentInmate(null);
    setEditFormData({ housing_unit: '', notes: '' });
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleUpdateInmate = async () => {
    if (!currentInmate) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${currentInmate.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Inmate details updated successfully!' });
      handleCloseEditDialog();
      fetchInmates(); // Refresh the list
    } catch (err) {
      console.error('Error updating inmate:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update inmate details!' });
    }
  };

  // Sorting logic
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedInmates = useMemo(() => {
    let sortableInmates = [...inmates];
    if (sortConfig.key) {
      sortableInmates.sort((a, b) => {
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
    return sortableInmates;
  }, [inmates, sortConfig]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Inmates Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Button variant="contained" color="primary" onClick={handleAddInmate} startIcon={<AddIcon />} sx={{ mb: 2, mr: 2 }}>
        Add Inmate
      </Button>
      <Button variant="contained" color="secondary" onClick={() => setAssignOpen(true)} startIcon={<AddIcon />} sx={{ mb: 2 }}>
        Assign New Items
      </Button>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>All Inmates</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'id'}
                  direction={sortConfig.key === 'id' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'name'}
                  direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'housing_unit'}
                  direction={sortConfig.key === 'housing_unit' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('housing_unit')}
                >
                  Housing Unit
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'fees_paid'}
                  direction={sortConfig.key === 'fees_paid' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('fees_paid')}
                >
                  Fees Paid
                </TableSortLabel>
              </TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell> {/* Actions column */}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedInmates.map((inmate) => (
              <TableRow key={inmate.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                <TableCell>{inmate.id}</TableCell>
                <TableCell>{inmate.name}</TableCell>
                <TableCell>{inmate.housing_unit}</TableCell>
                <TableCell>${inmate.fees_paid.toFixed(2)}</TableCell>
                <TableCell>{inmate.notes}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenEditDialog(inmate)} color="primary">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Assign New Items Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <DialogTitle>Assign New Items</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Inmate ID"
              value={inmateId}
              onChange={(e) => setInmateId(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignItems} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Inmate Dialog */}
      {currentInmate && (
        <Dialog open={editOpen} onClose={handleCloseEditDialog}>
          <DialogTitle>Edit Inmate: {currentInmate.name} (ID: {currentInmate.id})</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Housing Unit"
                name="housing_unit"
                value={editFormData.housing_unit}
                onChange={handleEditFormChange}
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Notes"
                name="notes"
                value={editFormData.notes}
                onChange={handleEditFormChange}
                variant="outlined"
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={handleUpdateInmate} color="primary">Update</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default InmatesDashboard;

