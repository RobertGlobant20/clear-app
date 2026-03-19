import type { ScanResponse, AirportSearchResult, Advisory, AnomalyResult, AirlineProfile } from '@frcs/shared';

const BASE = '';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE}${url}`, init);
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`API error ${resp.status}: ${body}`);
  }
  return resp.json() as Promise<T>;
}

export const api = {
  searchAirports(query: string): Promise<AirportSearchResult[]> {
    return fetchJson(`/api/airports/search?q=${encodeURIComponent(query)}`);
  },

  scanRoute(origin: string, destination: string): Promise<ScanResponse> {
    return fetchJson('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    });
  },

  getAdvisories(): Promise<Advisory[]> {
    return fetchJson('/api/advisories');
  },

  getAnomalies(route: string): Promise<AnomalyResult[]> {
    return fetchJson(`/api/anomalies?route=${encodeURIComponent(route)}`);
  },

  getAirlineProfiles(route: string): Promise<AirlineProfile[]> {
    return fetchJson(`/api/airlines/profiles?route=${encodeURIComponent(route)}`);
  },

  subscribeAdvisories(onMessage: (advisories: Advisory[]) => void): EventSource {
    const source = new EventSource('/api/advisories/stream');
    source.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data));
      } catch { /* ignore parse errors */ }
    };
    return source;
  },
};
