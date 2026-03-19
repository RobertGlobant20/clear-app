import type { FastifyInstance } from 'fastify';
import { getAirportByCode } from '../services/airports.service.js';
import { scoreMultipleRoutes } from '../algorithms/route-scorer.js';
import { calculateRisk } from '../algorithms/risk-calculator.js';
import { findAlternatives } from '../algorithms/alternative-finder.js';
import type { ScanRequest, ScanResponse } from '@frcs/shared';

export async function scanRoutes(app: FastifyInstance) {
  app.post<{ Body: ScanRequest }>('/api/scan', async (req, reply) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return reply.status(400).send({ error: 'Origin and destination are required' });
    }

    const originAirport = getAirportByCode(origin);
    const destAirport = getAirportByCode(destination);

    if (!originAirport) {
      return reply.status(404).send({ error: `Airport not found: ${origin}` });
    }
    if (!destAirport) {
      return reply.status(404).send({ error: `Airport not found: ${destination}` });
    }

    const routes = scoreMultipleRoutes(
      originAirport.latitude, originAirport.longitude,
      destAirport.latitude, destAirport.longitude
    );

    const bestRoute = routes[0];
    const routeLabel = `${origin}-${destination}`;

    const riskScore = calculateRisk(
      originAirport.latitude, originAirport.longitude,
      destAirport.latitude, destAirport.longitude,
      routeLabel
    );

    const alternatives = bestRoute.score < 70
      ? findAlternatives(
          originAirport.latitude, originAirport.longitude,
          destAirport.latitude, destAirport.longitude,
          origin.toUpperCase(), destination.toUpperCase(),
          bestRoute.score
        )
      : [];

    const response: ScanResponse = {
      origin: {
        code: originAirport.iataCode || origin,
        name: originAirport.name,
        lat: originAirport.latitude,
        lon: originAirport.longitude,
      },
      destination: {
        code: destAirport.iataCode || destination,
        name: destAirport.name,
        lat: destAirport.latitude,
        lon: destAirport.longitude,
      },
      routes,
      riskScore,
      alternatives,
    };

    return response;
  });
}
