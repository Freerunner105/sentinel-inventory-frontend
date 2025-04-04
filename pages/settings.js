import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Button, Alert, Radio, RadioGroup, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const Settings = () => {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [fees, setFees] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Staff', first_name: '', last_name: '', email: '' });
  const [newFee, setNewFee] = useState({ name: '', amount: '', inmate_id: '', item_barcodes: '', notes: '' });
  const [alertMessage, setAlertMessage] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'fees') fetchFees();
  }, [tab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch users!' });
    }
  };

  const fetchFees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings/fees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFees(res.data);
      setAlertMessage(null);
    } catch (err) {
      console.error('Error fetching fees:', err);
      setAlertMessage({ type: 'error', text: 'Failed to fetch fees!' });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.first_name || !newUser.last_name) {
      setAlertMessage({ type: 'error', text: 'Username, Password, First Name, and Last Name are required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/settings/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers([...users, res.data]);
      setNewUser({ username: '', password: '', role: 'Staff', first_name: '', last_name: '', email: '' });
      setUserDialogOpen(false);
      setAlertMessage({ type: 'success', text: 'User added successfully!' });
    } catch (err) {
      console.error('Error adding user:', err);
      setAlertMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add user!' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/settings/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter((user) => user.id !== userId));
      setAlertMessage({ type: 'success', text: 'User deleted successfully!' });
    } catch (err) {
      console.error('Error deleting user:', err);
      setAlertMessage({ type: 'error', text: 'Failed to delete user!' });
    }
  };

  const handleAddFee = async () => {
    if (!newFee.name || !newFee.amount) {
      setAlertMessage({ type: 'error', text: 'Name and Amount are required!' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/settings/fees`, newFee, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFees([...fees, res.data]);
      setNewFee({ name: '', amount: '', inmate_id: '', item_barcodes: '', notes: '' });
      setFeeDialogOpen(false);
      setAlertMessage({ type: 'success', text: 'Fee added successfully!' });
    } catch (err) {
      console.error('Error adding fee:', err);
      setAlertMessage({ type: 'error', text: 'Failed to add fee!' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">Settings Dashboard</Typography>
      {alertMessage && (
        <Alert severity={alertMessage.type} onClose={() => setAlertMessage(null)} sx={{ mb: 2 }}>
          {alertMessage.text}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant={tab === 'users' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setTab('users')}
          >
            User Management
          </Button>
          <Button
            variant={tab === 'fees' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setTab('fees')}
          >
            Fee Management
          </Button>
        </Box>

        {tab === 'users' && (
          <>
            <Typography variant="h6" gutterBottom>All Users</Typography>
            <Table sx={{ mb: 3 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.first_name}</TableCell>
                    <TableCell>{user.last_name}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button variant="contained" color="primary" onClick={() => setUserDialogOpen(true)} startIcon={<AddIcon />}>
                Add User
              </Button>
            </Box>
          </>
        )}

        {tab === 'fees' && (
          <>
            <Typography variant="h6" gutterBottom>All Fees</Typography>
            <Table sx={{ mb: 3 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Inmate</TableCell>
                  <TableCell>Item Barcodes</TableCell>
                  <TableCell>Date Applied</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id} sx={{ '&:hover': { backgroundColor: '#F0F4F8' } }}>
                    <TableCell>{fee.id}</TableCell>
                    <TableCell>{fee.name}</TableCell>
                    <TableCell>${fee.amount.toFixed(2)}</TableCell>
                    <TableCell>{fee.inmate_name || 'N/A'} ({fee.inmate_id || 'N/A'})</TableCell>
                    <TableCell>{fee.item_barcodes || 'N/A'}</TableCell>
                    <TableCell>{new Date(fee.date_applied).toLocaleDateString()}</TableCell>
                    <TableCell>{fee.notes || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button variant="contained" color="primary" onClick={() => setFeeDialogOpen(true)} startIcon={<AddIcon />}>
                Add Fee
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Add User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} variant="outlined" />
            <TextField label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} variant="outlined" />
            <TextField label="First Name" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} variant="outlined" />
            <TextField label="Last Name" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} variant="outlined" />
            <TextField label="Email (optional)" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} variant="outlined" />
            <RadioGroup row value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <FormControlLabel value="Admin" control={<Radio />} label="Admin" />
              <FormControlLabel value="Staff" control={<Radio />} label="Staff" />
              <FormControlLabel value="Trustee" control={<Radio />} label="Trustee" />
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUser} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Add Fee Dialog */}
      <Dialog open={feeDialogOpen} onClose={() => setFeeDialogOpen(false)}>
        <DialogTitle>Add New Fee</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Fee Name" value={newFee.name} onChange={(e) => setNewFee({ ...newFee, name: e.target.value })} variant="outlined" />
            <TextField label="Amount ($)" type="number" value={newFee.amount} onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })} variant="outlined" />
            <TextField label="Inmate ID (optional)" value={newFee.inmate_id} onChange={(e) => setNewFee({ ...newFee, inmate_id: e.target.value })} variant="outlined" />
            <TextField label="Item Barcodes (optional)" value={newFee.item_barcodes} onChange={(e) => setNewFee({ ...newFee, item_barcodes: e.target.value })} variant="outlined" />
            <TextField label="Notes (optional)" value={newFee.notes} onChange={(e) => setNewFee({ ...newFee, notes: e.target.value })} multiline rows={2} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFee} color="primary">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;