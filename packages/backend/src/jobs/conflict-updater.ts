import { fetchConflictEvents, storeConflictEvents, computeConflictZones } from '../services/acled.service.js';

export async function updateConflictData(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Updating conflict data...`);

  try {
    const events = await fetchConflictEvents();
    if (events.length > 0) {
      storeConflictEvents(events);
      console.log(`  Stored ${events.length} conflict events`);
    }
    computeConflictZones();
    console.log(`  Conflict zones recomputed`);
  } catch (err) {
    console.error('  Error updating conflict data:', err);
  }
}
