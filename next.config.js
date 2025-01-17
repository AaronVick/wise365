// next.config.js

const path = require("path");

module.exports = {
  reactStrictMode: true,
  experimental: {
    esmExternals: "loose", // Ensure external dependencies are compatible with ES modules
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  env: {
    FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Handle multiline env variables
    FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_AUTH_URI: process.env.FIREBASE_AUTH_URI,
    FIREBASE_AUTH_PROVIDER_CERT_URL:
      process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    FIREBASE_TOKEN_URI: process.env.FIREBASE_TOKEN_URI,
    FIREBASE_CLIENT_CERT_URL: process.env.FIREBASE_CLIENT_CERT_URL,
    NEXT_PUBLIC_FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
    NEXT_PUBLIC_FIREBASE_AUTH_URI: process.env.FIREBASE_AUTH_URI,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_PRIVATE_KEY_ID:
      process.env.FIREBASE_PRIVATE_KEY_ID,
    NEXT_PUBLIC_FIREBASE_TYPE: process.env.FIREBASE_TYPE,
  },
  webpack: (config) => {
    // Add alias for '@' to resolve to the root directory
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname), // Adds '@' alias for the project root
    };

    // Fix for using 'fs' or other Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // Prevents issues when server-side modules are used in client-side code
      net: false,
      tls: false,
    };

    return config;
  },
};
