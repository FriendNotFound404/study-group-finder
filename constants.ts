
/**
 * API Configuration
 * Update the production URL when you deploy your Laravel backend.
 */
export const API_CONFIG = {
  BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : 'https://api.your-campus-hub.com/api', // Replace with your actual production domain
  TIMEOUT: 10000,
};
