import type { FastifyInstance } from 'fastify';
import { getAdvisories } from '../services/notam.service.js';

export async function advisoryRoutes(app: FastifyInstance) {
  app.get('/api/advisories', async () => {
    return getAdvisories();
  });

  // Server-Sent Events for live updates
  app.get('/api/advisories/stream', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const send = () => {
      const advisories = getAdvisories();
      reply.raw.write(`data: ${JSON.stringify(advisories)}\n\n`);
    };

    send();
    const interval = setInterval(send, 60000);

    req.raw.on('close', () => {
      clearInterval(interval);
    });
  });
}
