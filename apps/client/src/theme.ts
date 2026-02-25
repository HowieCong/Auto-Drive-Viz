import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ffff', // Cyan
    },
    secondary: {
      main: '#ff00ff', // Magenta
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#eeeeee',
      secondary: '#aaaaaa',
    },
    success: {
      main: '#00ff00',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffff00',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 700,
      fontStyle: 'italic',
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #333',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        thumb: {
          color: '#00ffff',
        },
        track: {
          color: '#00ffff',
        },
        rail: {
          color: '#444',
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                backgroundImage: 'none', // Remove gradient overlay in dark mode
            }
        }
    }
  },
});
