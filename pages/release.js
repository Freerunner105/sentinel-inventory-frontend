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
      if (!token) {
        setAlertMessage({ type: 'error', text: 'Authentication token not found. Please log in again.' });
        return;
      }
      console.log("Fetching inmates list...");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Inmates list fetched:", response.data);

      const inmatesWithDetailsPromises = response.data.map(async (inmate) => {
        try {
          console.log(`Fetching details for inmate ${inmate.id}...`);
          const itemsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${inmate.id}/items`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`Items for inmate ${inmate.id}:`, itemsResponse.data);

          const feesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${inmate.id}/fees`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`Fees for inmate ${inmate.id}:`, feesResponse.data);

          const assignedItemsString = Array.isArray(itemsResponse.data) ? itemsResponse.data.map(item => item.name || 'Unnamed Item').join(', ') : 'Error loading items';
          const totalFeesAmount = Array.isArray(feesResponse.data) ? feesResponse.data.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0) : 0;

          return {
            ...inmate,
            assignedItems: assignedItemsString,
            totalFees: totalFeesAmount
          };
        } catch (err) {
          console.error(`Error fetching details for inmate ${inmate.id}:`, err);
          let detailErrorMsg = 'Error loading details';
          if (err.response) {
            detailErrorMsg = `Details error: ${err.response.status} ${err.response.data.error || err.response.statusText}`;
          } else if (err.request) {
            detailErrorMsg = 'Details error: No server response';
          } else {
            detailErrorMsg = `Details error: ${err.message}`;
          }
          return {
            ...inmate,
            assignedItems: detailErrorMsg,
            totalFees: 'Error',
            errorLoadingDetails: true 
          };
        }
      });

      const inmatesWithDetails = await Promise.all(inmatesWithDetailsPromises);
      console.log("Inmates with details:", inmatesWithDetails);

      const detailErrorInmates = inmatesWithDetails.filter(i => i.errorLoadingDetails);
      if (detailErrorInmates.length > 0) {
          setAlertMessage({ type: 'warning', text: `Failed to fetch full details for ${detailErrorInmates.length} inmate(s). Displaying partial data. Check console for more info.` });
      } else {
          setAlertMessage(null);
      }
      // Remove the error flag before setting state for UI display
      setInmates(inmatesWithDetails.map(({errorLoadingDetails, ...rest}) => rest)); 

    } catch (err) {
      console.error('Error in fetchInmates main try-catch:', err);
      let detailedErrorMessage = 'Failed to fetch inmates list!';
      if (err.response) {
        detailedErrorMessage = `Failed to fetch inmates list. Server responded with ${err.response.status}: ${err.response.data.error || err.response.statusText}`;
      } else if (err.request) {
        detailedErrorMessage = 'Failed to fetch inmates list. No response received from server.';
      } else {
        detailedErrorMessage = `Failed to fetch inmates list. Error: ${err.message}`;
      }
      setAlertMessage({ type: 'error', text: detailedErrorMessage });
    }
  };

  const handleReleaseSubmit = async () => {
    if (!barcode) {
      setAlertMessage({ type: 'error', text: 'Inmate ID is required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Check if inmate has assigned items before proceeding to release page
      const itemsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${barcode}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (itemsResponse.data && itemsResponse.data.length > 0) {
        setAlertMessage({ type: 'error', text: `Cannot release inmate ${barcode}. They have ${itemsResponse.data.length} item(s) still assigned. Please process items first.` });
        return;
      }
      // If no items, proceed to the specific release page for confirmation
      router.push(`/release/${barcode}`); 
      setBarcode('');
      setReleaseOpen(false);
    } catch (err) {
      console.error('Error checking inmate items for release:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to check inmate items for release!' });
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
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/laundry/return-inventory`, { barcode: selectedBarcode, condition }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMessage({ type: 'success', text: 'Item returned to inventory!' });
      setSelectedBarcode('');
      setConditionOpen(false);
      fetchInmates(); // Refresh inmate list as item status might affect their displayed details indirectly
    } catch (err) {
      console.error('Error returning item to inventory:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to return item to inventory!' });
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
                <TableCell>{typeof inmate.totalFees === 'number' ? `$${inmate.totalFees.toFixed(2)}` : inmate.totalFees}</TableCell>
                <TableCell>{inmate.assignedItems || 'None'}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => router.push(`/release/${inmate.id}`)}>
                    View Details / Release
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Release Inmate Dialog - For entering Inmate ID */}
      <Dialog open={releaseOpen} onClose={() => setReleaseOpen(false)}>
        <DialogTitle>Release Inmate - Enter ID</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label="Inmate ID"
              value={barcode} // Using 'barcode' state, consider renaming to 'inmateIdToRelease'
              onChange={(e) => setBarcode(e.target.value)} 
              variant="outlined" 
              helperText="Enter the ID of the inmate to check for release eligibility."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseOpen(false)}>Cancel</Button>
          <Button onClick={handleReleaseSubmit} color="primary">Check & Proceed</Button>
        </DialogActions>
      </Dialog>

      {/* Return Item to Inventory Dialog - Barcode Entry */}
      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)}>
        <DialogTitle>Return Item to Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label="Item Barcode"
              value={barcode} // Using 'barcode' state, consider renaming to 'itemBarcodeToReturn'
              onChange={(e) => setBarcode(e.target.value)} 
              variant="outlined" 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnOpen(false)}>Cancel</Button>
          <Button onClick={handleReturnToInventorySubmit} color="primary">Next</Button>
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

