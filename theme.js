// theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1A3C5A', // Navy blue
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F5F6F5', // Light gray (used as background)
      contrastText: '#1A3C5A',
    },
    error: {
      main: '#D32F2F',
    },
    background: {
      default: '#F5F6F5', // Light gray background for the app
      paper: '#FFFFFF',   // White for Paper components
    },
    text: {
      primary: '#1A3C5A', // Navy blue for primary text
      secondary: '#666666', // Gray for secondary text
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;