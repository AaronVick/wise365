const express = require('express');
const publicExpressRoutes = require('./public');
const teamMemberExpressRoutes = require('./team-member');
const teamLeaderApi = require('./team-leader');

const handleError = (err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

module.exports = function api(server) {
  server.use('/api/v1/public', publicExpressRoutes, handleError);
  server.use('/api/v1/team-member', teamMemberExpressRoutes, handleError);
  server.use('/api/v1/team-leader', teamLeaderApi, handleError);
};
