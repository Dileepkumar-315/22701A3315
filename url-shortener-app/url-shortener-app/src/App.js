import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Tabs, Tab, Box } from '@mui/material';
import UrlShortener from '../components/UrlShortener';
import Statistics from './components/Statistics';
import loggingMiddleware from '../services/loggingMiddleware';
import './App.css';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  React.useEffect(() => {
    loggingMiddleware.info('App initialized');
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="URL Shortener" />
            <Tab label="Statistics" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <UrlShortener />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Statistics />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;