import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import urlService from '../services/urlService';
import loggingMiddleware from './services/loggingMiddleware';

const Statistics = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        loggingMiddleware.info('Fetching statistics data');
        const data = await urlService.getStatistics();
        setStats(data);
        loggingMiddleware.info('Statistics data fetched successfully', { count: data.length });
      } catch (error) {
        loggingMiddleware.error('Error fetching statistics', { error: error.message });
      }
    };

    fetchStats();
  }, []);

  if (stats.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          URL Statistics
        </Typography>
        <Typography variant="body1">
          No shortened URLs available. Create some URLs on the Shortener page to see statistics here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        URL Statistics
      </Typography>
      
      <Typography variant="body1" paragraph>
        Analytics for all shortened URLs created in this session.
      </Typography>

      {stats.map((url) => (
        <Accordion key={url.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{url.shortUrl}</Typography>
                <Typography variant="body2">
                  Original: {url.longUrl.length > 50 ? `${url.longUrl.substring(0, 50)}...` : url.longUrl}
                </Typography>
              </Box>
              <Chip 
                label={`${url.clicks} clicks`} 
                color={url.clicks > 0 ? 'primary' : 'default'} 
                variant="outlined" 
              />
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2"><strong>Created:</strong> {url.createdAt.toLocaleString()}</Typography>
              <Typography variant="body2"><strong>Expires:</strong> {url.expiresAt.toLocaleString()}</Typography>
            </Box>
            
            {url.clicks > 0 ? (
              <>
                <Typography variant="h6" gutterBottom>Click Details</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Source</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {url.clicksData.map((click, index) => (
                        <TableRow key={index}>
                          <TableCell>{click.timestamp.toLocaleString()}</TableCell>
                          <TableCell>{click.location}</TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {click.source}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography variant="body2">No clicks yet.</Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default Statistics;