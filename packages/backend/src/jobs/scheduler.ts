import cron from 'node-cron';
import { pollFlights } from './flight-poller.js';
import { updateConflictData } from './conflict-updater.js';

export function startScheduler(): void {
  // Poll flight states every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    pollFlights().catch(console.error);
  });

  // Update conflict data every 6 hours
  cron.schedule('0 */6 * * *', () => {
    updateConflictData().catch(console.error);
  });

  console.log('Background job scheduler started');

  // Run conflict update on startup (don't await - let server start)
  updateConflictData().catch(console.error);
}
