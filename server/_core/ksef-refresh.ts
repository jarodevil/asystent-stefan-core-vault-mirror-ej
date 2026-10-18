import {
  getKsefAlertStats,
  refreshKsefAlerts,
  seedHistoricalKsefAlerts,
} from "./ksef-monitor";
import { markSeederRun, shouldRunSeeder } from "./system-cache";

export type KsefRefreshResult = {
  executed: boolean;
  reason: string;
  totalFetched: number;
  newAlerts: number;
  historicalSeeded: boolean;
  historicalNewItems: number;
};

/**
 * Refreshes official KSeF sources and conditionally runs the historical seed.
 * Every write is deduplicated by the source-derived stable ID.
 */
export async function refreshKsefSources(
  options: { force?: boolean } = {}
): Promise<KsefRefreshResult> {
  const freshness = options.force
    ? { shouldRun: true, reason: "Wymuszone odświeżenie" }
    : await shouldRunSeeder("ksef_refresh_last_run", 6);

  if (!freshness.shouldRun) {
    return {
      executed: false,
      reason: freshness.reason,
      totalFetched: 0,
      newAlerts: 0,
      historicalSeeded: false,
      historicalNewItems: 0,
    };
  }

  const refresh = await refreshKsefAlerts();
  if (!refresh.success) {
    throw new Error("KSeF source refresh failed; freshness was not advanced.");
  }
  await markSeederRun("ksef_refresh_last_run", {
    totalFetched: refresh.totalFetched,
    newAlerts: refresh.newAlerts,
  });

  const [stats, seedFreshness] = await Promise.all([
    getKsefAlertStats(),
    shouldRunSeeder("seeder_last_run", 24),
  ]);

  if (stats.total > 0 && !seedFreshness.shouldRun) {
    return {
      executed: true,
      reason: freshness.reason,
      totalFetched: refresh.totalFetched,
      newAlerts: refresh.newAlerts,
      historicalSeeded: false,
      historicalNewItems: 0,
    };
  }

  const seeded = await seedHistoricalKsefAlerts();
  if (!seeded.success) {
    throw new Error(`KSeF historical seed failed: ${seeded.message}`);
  }
  await markSeederRun("seeder_last_run", {
    totalFetched: seeded.totalFetched,
    newItems: seeded.newItems,
  });

  return {
    executed: true,
    reason: freshness.reason,
    totalFetched: refresh.totalFetched,
    newAlerts: refresh.newAlerts,
    historicalSeeded: true,
    historicalNewItems: seeded.newItems,
  };
}
