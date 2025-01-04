import type { Request, Response, NextFunction, Express } from 'express';

import publicExpressRoutes from './public';
import teamMemberExpressRoutes from './team-member';
import teamLeaderApi from './team-leader';

function handleError(err: Error, _: Request, res: Response, __: NextFunction): void {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
}

export default function api(server: Express): void {
  server.use('/api/v1/public', publicExpressRoutes, handleError);
  server.use('/api/v1/team-member', teamMemberExpressRoutes, handleError);
  server.use('/api/v1/team-leader', teamLeaderApi, handleError);
}
