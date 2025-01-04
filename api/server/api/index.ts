// api/server/api/index.ts
import type { ErrorRequestHandler, Request, Response, Express } from 'express';

import publicExpressRoutes from './public';
import teamMemberExpressRoutes from './team-member';
import teamLeaderApi from './team-leader';

const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

export default function api(server: Express): void {
  server.use('/api/v1/public', publicExpressRoutes, handleError);
  server.use('/api/v1/team-member', teamMemberExpressRoutes, handleError);
  server.use('/api/v1/team-leader', teamLeaderApi, handleError);
}