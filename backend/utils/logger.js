/**
 * Centralized logging utility
 * Provides consistent logging format across the application
 */

const logLevels = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG'
};

/**
 * Format log message with timestamp and level
 */
const formatLog = (level, context, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    context,
    message,
    ...(data && { data })
  };
  return logEntry;
};

/**
 * Log info messages
 */
const info = (context, message, data = null) => {
  const log = formatLog(logLevels.INFO, context, message, data);
  console.log(JSON.stringify(log));
};

/**
 * Log error messages with stack trace
 */
const error = (context, message, err = null, additionalData = null) => {
  const data = {
    ...(err && {
      error: err.message,
      stack: err.stack,
      code: err.code
    }),
    ...(additionalData && additionalData)
  };

  const log = formatLog(logLevels.ERROR, context, message, data);
  console.error(JSON.stringify(log));
};

/**
 * Log warning messages
 */
const warn = (context, message, data = null) => {
  const log = formatLog(logLevels.WARN, context, message, data);
  console.warn(JSON.stringify(log));
};

/**
 * Log debug messages (only in development)
 */
const debug = (context, message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    const log = formatLog(logLevels.DEBUG, context, message, data);
    console.debug(JSON.stringify(log));
  }
};

/**
 * Log API request
 */
const logRequest = (method, path, userId = null, query = null, body = null) => {
  info('API_REQUEST', `${method} ${path}`, {
    userId,
    query,
    body: body ? { ...body, password: body.password ? '***' : undefined } : null
  });
};

/**
 * Log API response
 */
const logResponse = (method, path, statusCode, data = null) => {
  info('API_RESPONSE', `${method} ${path} - ${statusCode}`, data);
};

/**
 * Log API error
 */
const logApiError = (method, path, err, statusCode = 500, additionalData = null) => {
  error('API_ERROR', `${method} ${path} - ${statusCode}`, err, additionalData);
};

module.exports = {
  info,
  error,
  warn,
  debug,
  logRequest,
  logResponse,
  logApiError
};
