import * as express from 'express';
import api from './api';

const server = express();

server.use(express.json()); // Parse JSON bodies
server.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Add API routes
api(server);

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`API server is running on http://localhost:${PORT}`);
});
