import { LRUCache } from 'lru-cache';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const cache = new LRUCache<string, { data: any; timestamp: number }>({
  max: 500,
  ttl: 1000 * 60 * 15, // 15 minutes default
});

export async function cachePlugin(app: FastifyInstance) {
  app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.method !== 'GET') return;

    const key = req.url;
    const cached = cache.get(key);
    if (cached) {
      reply.header('X-Cache', 'HIT');
      return reply.send(cached.data);
    }
  });

  app.addHook('onSend', async (req: FastifyRequest, reply: FastifyReply, payload: any) => {
    if (req.method !== 'GET') return payload;
    if (reply.statusCode !== 200) return payload;
    if (reply.getHeader('X-Cache') === 'HIT') return payload;

    const key = req.url;
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      cache.set(key, { data, timestamp: Date.now() });
    } catch {
      // Not JSON, skip caching
    }
    return payload;
  });
}

export function clearCache(): void {
  cache.clear();
}
