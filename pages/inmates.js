import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // Added useRef
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, TableSortLabel, IconButton, InputAdornment, CircularProgress, List, ListItem, ListItemText } from '@mui/material'; // Added CircularProgress, List, ListItem, ListItemText
import { useRouter } from 'next/router';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload'; // Import FileUploadIcon
import _debounce from 'lodash/debounce';

const InmatesDashboard = () => {
  const [inmates, setInmates] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentInmate, setCurrentInmate] = useState(null);
  const [editFormData, setEditFormData] = useState({ housing_unit: '', notes: '' });
  const [inmateId, setInmateId] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // CSV Import States
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null); // Ref for file input

  const debouncedFetchInmates = useCallback(
    _debounce(async (currentSearchTerm) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/');
          return;
        }
        const params = {};
        if (currentSearchTerm) {
          params.search = currentSearchTerm;
        }
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        setInmates(response.data);
        setAlertMessage(null);
      } catch (err) {
        console.error('Error fetching inmates:', err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
          setAlertMessage({ type: 'error', text: 'Session expired. Please log in again.' });
        } else {
          setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to fetch inmates!' });
        }
      }
    }, 500),
    [router]
  );

  useEffect(() => {
    debouncedFetchInmates(searchTerm);
    return () => {
      debouncedFetchInmates.cancel();
    };
  }, [searchTerm, debouncedFetchInmates]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
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
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${currentInmate.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Inmate details updated successfully!' });
      handleCloseEditDialog();
      debouncedFetchInmates(searchTerm);
    } catch (err) {
      console.error('Error updating inmate:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update inmate details!' });
    }
  };

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

  // CSV Import Handlers
  const handleOpenCsvImportDialog = () => {
    setCsvImportOpen(true);
    setSelectedFile(null);
    setImportSummary(null);
    setAlertMessage(null);
  };

  const handleCloseCsvImportDialog = () => {
    setCsvImportOpen(false);
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setImportSummary(null); // Clear previous summary
    setAlertMessage(null);
  };

  const handleCsvImport = async () => {
    if (!selectedFile) {
      setAlertMessage({ type: 'error', text: 'Please select a CSV file to import.' });
      return;
    }
    setIsImporting(true);
    setImportSummary(null);
    setAlertMessage(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/inmates/import_csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setImportSummary({ message: response.data.message, errors: response.data.errors || [] });
      if (response.status === 201 || response.status === 207) { // 201 Created, 207 Multi-Status
        setAlertMessage({ type: 'success', text: response.data.message });
        debouncedFetchInmates(searchTerm); // Refresh inmate list
      } else {
        setAlertMessage({ type: 'error', text: response.data.error || 'An unexpected error occurred during import.' });
      }
    } catch (err) {
      console.error('Error importing CSV:', err);
      const errorData = err.response?.data;
      setAlertMessage({ type: 'error', text: errorData?.error || errorData?.message || 'Failed to import CSV file.' });
      if (errorData?.errors) {
        setImportSummary({ message: errorData?.message || 'Import failed with errors:', errors: errorData.errors });
      }
    } finally {
      setIsImporting(false);
      // Reset file input for next upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Inmates Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Button variant="contained" color="primary" onClick={handleAddInmate} startIcon={<AddIcon />} sx={{ mr: 1 }}>
            Add Inmate
          </Button>
          <Button variant="contained" color="secondary" onClick={() => setAssignOpen(true)} startIcon={<AddIcon />} sx={{ mr: 1 }}>
            Assign New Items
          </Button>
          <Button variant="outlined" color="primary" onClick={handleOpenCsvImportDialog} startIcon={<FileUploadIcon />}>
            Import from CSV
          </Button>
        </Box>
        <TextField
          label="Search Inmates (ID or Name)"
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
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>All Inmates</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><TableSortLabel active={sortConfig.key === 'id'} direction={sortConfig.key === 'id' ? sortConfig.direction : 'asc'} onClick={() => requestSort('id')}>ID</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'name'} direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'} onClick={() => requestSort('name')}>Name</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'housing_unit'} direction={sortConfig.key === 'housing_unit' ? sortConfig.direction : 'asc'} onClick={() => requestSort('housing_unit')}>Housing Unit</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'fees_owed'} direction={sortConfig.key === 'fees_owed' ? sortConfig.direction : 'asc'} onClick={() => requestSort('fees_owed')}>Fees Owed</TableSortLabel></TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedInmates.map((inmate) => (
              <TableRow key={inmate.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                <TableCell>{inmate.id}</TableCell>
                <TableCell>{inmate.name}</TableCell>
                <TableCell>{inmate.housing_unit}</TableCell>
                <TableCell>${inmate.fees_owed !== undefined && inmate.fees_owed !== null ? inmate.fees_owed.toFixed(2) : '0.00'}</TableCell>
                <TableCell>{inmate.notes}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenEditDialog(inmate)} color="primary" aria-label="edit inmate">
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
            <TextField label="Inmate ID" value={inmateId} onChange={(e) => setInmateId(e.target.value)} variant="outlined" />
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
              <TextField label="Housing Unit" name="housing_unit" value={editFormData.housing_unit} onChange={handleEditFormChange} variant="outlined" fullWidth />
              <TextField label="Notes" name="notes" value={editFormData.notes} onChange={handleEditFormChange} variant="outlined" multiline rows={3} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={handleUpdateInmate} color="primary">Update</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* CSV Import Dialog */}
      <Dialog open={csvImportOpen} onClose={handleCloseCsvImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Import Inmates from CSV</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Select a CSV file to import inmates. The CSV file must have the following headers in this order: <strong>last name, first name, housing unit, notes, ID</strong>.
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<FileUploadIcon />}
            sx={{ mt: 2, mb: 2 }}
          >
            Select CSV File
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </Button>
          {selectedFile && <Typography variant="body2" sx={{ mb: 1 }}>Selected file: {selectedFile.name}</Typography>}
          {isImporting && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
          {importSummary && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle1" gutterBottom>{importSummary.message}</Typography>
              {importSummary.errors && importSummary.errors.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="error">Errors:</Typography>
                  <List dense>
                    {importSummary.errors.map((error, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText primaryTypographyProps={{ variant: 'body2', color: 'error' }} primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCsvImportDialog} disabled={isImporting}>Cancel</Button>
          <Button onClick={handleCsvImport} color="primary" variant="contained" disabled={!selectedFile || isImporting}>
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default InmatesDashboard;

