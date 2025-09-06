import React, { useState } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Box,
  Alert,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import urlService from '../services/urlService';
import loggingMiddleware from './services/loggingMiddleware';

const UrlShortener = () => {
  const [urls, setUrls] = useState([
    { longUrl: '', validity: '', shortCode: '', result: null, error: null }
  ]);
  const [maxReached, setMaxReached] = useState(false);

  const handleInputChange = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    newUrls[index].error = null;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, { longUrl: '', validity: '', shortCode: '', result: null, error: null }]);
      if (urls.length === 4) setMaxReached(true);
    }
  };

  const removeUrlField = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
      setMaxReached(newUrls.length >= 5);
    }
  };

  const handleSubmit = async (index) => {
    const urlData = urls[index];
    
    try {
      loggingMiddleware.info('Attempting to shorten URL', { index, urlData });
      
      const result = await urlService.shortenUrl(
        urlData.longUrl,
        urlData.validity ? parseInt(urlData.validity) : 30,
        urlData.shortCode || null
      );
      
      const newUrls = [...urls];
      newUrls[index].result = result;
      newUrls[index].error = null;
      setUrls(newUrls);
      
      loggingMiddleware.info('URL shortened successfully in UI', { index, result });
    } catch (error) {
      const newUrls = [...urls];
      newUrls[index].error = error.message;
      newUrls[index].result = null;
      setUrls(newUrls);
      
      loggingMiddleware.error('Error shortening URL in UI', { index, error: error.message });
    }
  };

  const handleSubmitAll = () => {
    urls.forEach((_, index) => {
      handleSubmit(index);
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        URL Shortener
      </Typography>
      
      <Typography variant="body1" paragraph>
        Shorten up to 5 URLs at once. You can optionally specify a validity period (default: 30 minutes) and a custom shortcode.
      </Typography>

      {urls.map((url, index) => (
        <Paper key={index} elevation={2} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Long URL"
                value={url.longUrl}
                onChange={(e) => handleInputChange(index, 'longUrl', e.target.value)}
                placeholder="https://example.com/very-long-url"
                error={!!url.error}
              />
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Validity (minutes)"
                type="number"
                value={url.validity}
                onChange={(e) => handleInputChange(index, 'validity', e.target.value)}
                placeholder="30"
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Custom Shortcode (optional)"
                value={url.shortCode}
                onChange={(e) => handleInputChange(index, 'shortCode', e.target.value)}
                placeholder="my-custom-link"
              />
            </Grid>
            
            <Grid item xs={12} sm={1}>
              <Button
                variant="contained"
                onClick={() => handleSubmit(index)}
                disabled={!url.longUrl}
              >
                Shorten
              </Button>
            </Grid>
            
            {urls.length > 1 && (
              <Grid item xs={12} sm={1}>
                <IconButton onClick={() => removeUrlField(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Grid>
            )}
          </Grid>

          {url.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {url.error}
            </Alert>
          )}

          {url.result && (
            <Card variant="outlined" sx={{ mt: 2, bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6">Short URL Created!</Typography>
                <Typography variant="body1">
                  <strong>Short URL:</strong>{' '}
                  <a href={url.result.shortUrl} target="_blank" rel="noopener noreferrer">
                    {url.result.shortUrl}
                  </a>
                </Typography>
                <Typography variant="body2">
                  <strong>Expires:</strong> {url.result.expiresAt.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Paper>
      ))}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addUrlField}
          disabled={maxReached}
        >
          Add Another URL {maxReached ? '(Max 5)' : ''}
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSubmitAll}
          disabled={urls.every(url => !url.longUrl)}
        >
          Shorten All URLs
        </Button>
      </Box>
    </Box>
  );
};

export default UrlShortener;