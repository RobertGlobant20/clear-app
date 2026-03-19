import type { FastifyInstance } from 'fastify';
import { searchAirports } from '../services/airports.service.js';

export async function airportRoutes(app: FastifyInstance) {
  app.get('/api/airports/search', async (req) => {
    const { q } = req.query as { q?: string };
    if (!q || q.length < 2) return [];
    return searchAirports(q, 10);
  });
}
