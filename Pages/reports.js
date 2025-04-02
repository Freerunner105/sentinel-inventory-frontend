import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';

const Reports = () => {
  const [tab, setTab] = useState('items'); // Simplified to toggle between reports
  const [itemReport, setItemReport] = useState([]);
  const [inmateReport, setInmateReport] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [filters, setFilters] = useState({ barcode: '', inmate_id: '', start_date: '', end_date: '' });
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    if (tab === 'items') fetchItemReport();
    else if (tab === 'inmates') fetchInmateReport();
    else if (tab === 'logs') fetchActionLogs();
  }, [tab]);

  const fetchItemReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filters.barcode) params.barcode = filters.barcode;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await axios.get('http://localhost:5000/reports/items', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setItemReport(res.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching item report:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch item report!' });
    }
  };

  const fetchInmateReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filters.inmate_id) params.inmate_id = filters.inmate_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await axios.get('http://localhost:5000/reports/inmates', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setInmateReport(res.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching inmate report:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch inmate report!' });
    }
  };

  const fetchActionLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await axios.get('http://localhost:5000/action_logs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setActionLogs(res.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching action logs:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch action logs or permission denied!' });
    }
  };

  const handleFilterChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value });
  };

  const handleGenerateReport = () => {
    if (tab === 'items') fetchItemReport();
    else if (tab === 'inmates') fetchInmateReport();
    else if (tab === 'logs') fetchActionLogs();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Reports Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant={tab === 'items' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setTab('items')}
          >
            Item Report
          </Button>
          <Button
            variant={tab === 'inmates' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setTab('inmates')}
          >
            Inmate Report
          </Button>
          <Button
            variant={tab === 'logs' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setTab('logs')}
          >
            Action Logs (Admin)
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {tab === 'items' && (
            <TextField
              label="Barcode (optional)"
              value={filters.barcode}
              onChange={handleFilterChange('barcode')}
              variant="outlined"
              sx={{ minWidth: 200 }}
            />
          )}
          {tab === 'inmates' && (
            <TextField
              label="Inmate ID (optional)"
              value={filters.inmate_id}
              onChange={handleFilterChange('inmate_id')}
              variant="outlined"
              sx={{ minWidth: 200 }}
            />
          )}
          <TextField
            label="Start Date (YYYY-MM-DD)"
            value={filters.start_date}
            onChange={handleFilterChange('start_date')}
            variant="outlined"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="End Date (YYYY-MM-DD)"
            value={filters.end_date}
            onChange={handleFilterChange('end_date')}
            variant="outlined"
            sx={{ minWidth: 200 }}
          />
          <Button variant="contained" color="primary" onClick={handleGenerateReport}>
            Generate Report
          </Button>
        </Box>

        {tab === 'items' && (
          <>
            <Typography variant="h6" gutterBottom>All Items</Typography>
            <Table sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Barcode</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Assigned Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemReport.map((item) => (
                  <TableRow key={item.barcode} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                    <TableCell>{item.barcode}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.condition}</TableCell>
                    <TableCell>${item.cost.toFixed(2)}</TableCell>
                    <TableCell>{item.assigned_date ? new Date(item.assigned_date).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {tab === 'inmates' && (
          <>
            <Typography variant="h6" gutterBottom>All Inmates</Typography>
            <Table sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Housing Unit</TableCell>
                  <TableCell>Fees Paid</TableCell>
                  <TableCell>Total Fees</TableCell>
                  <TableCell>Items Assigned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inmateReport.map((inmate) => (
                  <TableRow key={inmate.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                    <TableCell>{inmate.id}</TableCell>
                    <TableCell>{inmate.name}</TableCell>
                    <TableCell>{inmate.housing_unit}</TableCell>
                    <TableCell>${inmate.fees_paid.toFixed(2)}</TableCell>
                    <TableCell>${inmate.total_fees.toFixed(2)}</TableCell>
                    <TableCell>
                      {inmate.items_assigned.length > 0
                        ? inmate.items_assigned.map(item => `${item.name} (${item.barcode}, ${new Date(item.assigned_date).toLocaleDateString()})`).join(', ')
                        : 'None'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {tab === 'logs' && (
          <>
            <Typography variant="h6" gutterBottom>All Action Logs (Admin Only)</Typography>
            <Table sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {actionLogs.map((log) => (
                  <TableRow key={log.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;