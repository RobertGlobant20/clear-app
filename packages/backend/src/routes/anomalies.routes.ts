import type { FastifyInstance } from 'fastify';
import { detectAnomalies } from '../algorithms/anomaly-detector.js';

export async function anomalyRoutes(app: FastifyInstance) {
  app.get('/api/anomalies', async (req) => {
    const { route, days } = req.query as { route?: string; days?: string };
    if (!route) return [];

    // Use route as callsign pattern (e.g., "JFK-TLV" -> search for relevant callsigns)
    const callsignPattern = `%`;
    return detectAnomalies(callsignPattern, route || '');
  });
}
