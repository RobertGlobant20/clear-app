import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { getDb, closeDb } from './db/connection.js';
import { airportRoutes } from './routes/airports.routes.js';
import { scanRoutes } from './routes/scan.routes.js';
import { anomalyRoutes } from './routes/anomalies.routes.js';
import { advisoryRoutes } from './routes/advisories.routes.js';
import { airlineRoutes } from './routes/airlines.routes.js';
import { cachePlugin } from './middleware/cache.js';
import { startScheduler } from './jobs/scheduler.js';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  // Ensure data directory exists
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

  // Initialize database
  getDb();
  console.log('Database initialized');

  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(cachePlugin);

  // Register routes
  await app.register(airportRoutes);
  await app.register(scanRoutes);
  await app.register(anomalyRoutes);
  await app.register(advisoryRoutes);
  await app.register(airlineRoutes);

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Start background jobs
  if (config.nodeEnv !== 'test') {
    startScheduler();
  }

  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Server running at http://localhost:${config.port}`);

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down...');
    closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
