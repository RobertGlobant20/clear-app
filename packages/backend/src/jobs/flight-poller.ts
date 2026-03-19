import { MONITORED_CORRIDORS } from '@frcs/shared';
import { fetchFlightStates, storeFlightStates } from '../services/opensky.service.js';

export async function pollFlights(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Polling flight states...`);

  for (const corridor of MONITORED_CORRIDORS) {
    try {
      const states = await fetchFlightStates({
        minLat: corridor.minLat,
        maxLat: corridor.maxLat,
        minLon: corridor.minLon,
        maxLon: corridor.maxLon,
      });
      if (states.length > 0) {
        storeFlightStates(states);
        console.log(`  ${corridor.name}: ${states.length} aircraft`);
      }
    } catch (err) {
      console.error(`  Error polling ${corridor.name}:`, err);
    }
  }
}
