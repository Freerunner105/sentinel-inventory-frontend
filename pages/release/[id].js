   REM Clear the file
import React, { useState, useEffect } from 'react'; 
import { useRouter } from 'next/router'; 
import { Box, Typography, Paper, Button, Alert } from '@mui/material'; 
import axios from 'axios'; 
 
const ReleaseDetail = () =
  const [inmate, setInmate] = useState(null); 
  const [items, setItems] = useState([]); 
  const [alertMessage, setAlertMessage] = useState(null); 
  const router = useRouter(); 
  const { id } = router.query; 
 
  useEffect(() =
    if (id) { 
      fetchInmate(); 
      fetchItems(); 
    } 
  }, [id]); 
 
  const fetchInmate = async () =
    try { 
      const token = localStorage.getItem('token'); 
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }); 
      setInmate(response.data); 
    } catch (err) { 
      console.error('Error fetching inmate:', err); 
      setAlertMessage({ type: 'error', text: 'Failed to fetch inmate!' }); 
    } 
  }; 
 
  const fetchItems = async () =
    try { 
      const token = localStorage.getItem('token'); 
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inmates/${id}/items`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }); 
      setItems(response.data); 
    } catch (err) { 
      console.error('Error fetching items:', err); 
      setAlertMessage({ type: 'error', text: 'Failed to fetch items!' }); 
    } 
  }; 
 
  const handleRelease = async () =
    try { 
      const token = localStorage.getItem('token'); 
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/release/${id}`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      }); 
      setAlertMessage({ type: 'success', text: 'Inmate released successfully!' }); 
      setTimeout(() =, 1000); 
    } catch (err) { 
      console.error('Error releasing inmate:', err); 
    } 
  }; 
 
 
  return ( 
          {alertMessage.text} 
      )} 
        {items.length  ? ( 
        ) : ( 
            Confirm Release 
        )} 
  ); 
}; 
 
export default ReleaseDetail; 
