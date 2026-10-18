/** Compatibility wrapper for manually requested legal-news refreshes. */
import { refreshLegalNews } from "./legal-news-refresh";

export async function manualRSSRefresh(): Promise<{
  success: boolean;
  count: number;
}> {
  try {
    const result = await refreshLegalNews({ force: true });
    return { success: true, count: result.count };
  } catch (error) {
    console.error("[LEGAL NEWS] Manual refresh failed:", error);
    return { success: false, count: 0 };
  }
}
