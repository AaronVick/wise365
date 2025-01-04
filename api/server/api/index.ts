import express, { Request, Response, NextFunction } from 'express';

import publicExpressRoutes from './public';
import teamMemberExpressRoutes from './team-member';
import teamLeaderApi from './team-leader';

const handleError = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

export default function api(server: express.Express) {
  server.use('/api/v1/public', publicExpressRoutes, handleError);
  server.use('/api/v1/team-member', teamMemberExpressRoutes, handleError);
  server.use('/api/v1/team-leader', teamLeaderApi, handleError);
}
