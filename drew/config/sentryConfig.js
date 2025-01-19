// /config/sentryConfig.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Your Sentry DSN from the dashboard
  tracesSampleRate: 1.0,      // Adjust as needed
  environment: process.env.NODE_ENV || 'development',
});

module.exports = Sentry;
