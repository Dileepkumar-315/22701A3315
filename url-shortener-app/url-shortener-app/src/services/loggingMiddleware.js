class LoggingMiddleware {
  constructor() {
    this.logs = [];
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    this.logs.push(logEntry);
    
    // In a real application, you would send this to a logging service
    // For this demo, we'll just store it in memory
    console.log(`[${timestamp}] [${level}] ${message}`, data);
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  getLogs() {
    return this.logs;
  }
}

// Create a singleton instance
const loggingMiddleware = new LoggingMiddleware();
export default loggingMiddleware;