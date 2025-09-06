import loggingMiddleware from '../loggingMiddleware';

class UrlService {
  constructor() {
    // In-memory storage for demo purposes
    this.urlMappings = new Map();
    this.clickData = new Map();
    this.nextId = 1;
  }

  generateShortCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  async shortenUrl(longUrl, validityMinutes = 30, customShortCode = null) {
    loggingMiddleware.info('Shortening URL request received', { longUrl, validityMinutes, customShortCode });
    
    // Validate URL format
    try {
      new URL(longUrl);
    } catch (e) {
      loggingMiddleware.error('Invalid URL format', { longUrl });
      throw new Error('Please enter a valid URL');
    }
    
    // Validate validity minutes
    if (validityMinutes && (isNaN(validityMinutes) || validityMinutes <= 0)) {
      loggingMiddleware.error('Invalid validity minutes', { validityMinutes });
      throw new Error('Validity must be a positive number');
    }
    
    // Check if custom shortcode is provided and valid
    let shortCode;
    if (customShortCode) {
      if (!/^[a-zA-Z0-9_-]{4,}$/.test(customShortCode)) {
        loggingMiddleware.error('Invalid custom shortcode format', { customShortCode });
        throw new Error('Shortcode must be at least 4 characters and contain only letters, numbers, hyphens, and underscores');
      }
      
      if (this.urlMappings.has(customShortCode)) {
        loggingMiddleware.error('Shortcode already exists', { customShortCode });
        throw new Error('This shortcode is already in use. Please choose another one.');
      }
      shortCode = customShortCode;
    } else {
      // Generate a unique shortcode
      do {
        shortCode = this.generateShortCode();
      } while (this.urlMappings.has(shortCode));
    }
    
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + (validityMinutes * 60000));
    
    const urlData = {
      id: this.nextId++,
      longUrl,
      shortCode,
      createdAt,
      expiresAt,
      clicks: 0
    };
    
    this.urlMappings.set(shortCode, urlData);
    this.clickData.set(shortCode, []);
    
    loggingMiddleware.info('URL shortened successfully', { shortCode, urlData });
    
    return {
      shortUrl: `http://localhost:3000/${shortCode}`,
      ...urlData
    };
  }
  
  async getUrl(shortCode) {
    loggingMiddleware.info('Retrieving URL', { shortCode });
    
    const urlData = this.urlMappings.get(shortCode);
    if (!urlData) {
      loggingMiddleware.error('Shortcode not found', { shortCode });
      throw new Error('URL not found');
    }
    
    // Check if URL has expired
    if (new Date() > urlData.expiresAt) {
      loggingMiddleware.error('URL has expired', { shortCode, expiresAt: urlData.expiresAt });
      throw new Error('This URL has expired');
    }
    
    // Record click
    urlData.clicks += 1;
    const clickInfo = {
      timestamp: new Date(),
      source: navigator.userAgent,
      location: this.getCoarseLocation() // Simplified for demo
    };
    
    this.clickData.get(shortCode).push(clickInfo);
    loggingMiddleware.info('URL accessed', { shortCode, clickInfo });
    
    return urlData;
  }
  
  async getStatistics() {
    loggingMiddleware.info('Retrieving statistics');
    
    const stats = [];
    for (const [shortCode, urlData] of this.urlMappings.entries()) {
      stats.push({
        ...urlData,
        shortUrl: `http://localhost:3000/${shortCode}`,
        clicksData: this.clickData.get(shortCode) || []
      });
    }
    
    return stats;
  }
  
  getCoarseLocation() {
    // Simplified implementation for demo purposes
    // In a real application, you would use a geolocation API
    const locations = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
    return locations[Math.floor(Math.random() * locations.length)];
  }
}

// Create a singleton instance
const urlService = new UrlService();
export default urlService;