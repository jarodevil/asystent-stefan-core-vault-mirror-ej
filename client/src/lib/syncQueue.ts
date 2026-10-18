interface PendingAction {
  id: string;
  type: "note_create" | "note_update" | "note_delete";
  data: any;
  timestamp: number;
}

const QUEUE_KEY = "stefan_sync_queue";

/**
 * Adds an action to the sync queue
 */
export function queueAction(type: PendingAction["type"], data: any): void {
  const queue = getQueue();
  
  const action: PendingAction = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
  };
  
  queue.push(action);
  saveQueue(queue);
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    syncQueue();
  }
}

/**
 * Gets the current sync queue
 */
export function getQueue(): PendingAction[] {
  try {
    const saved = localStorage.getItem(QUEUE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Saves the queue to localStorage
 */
function saveQueue(queue: PendingAction[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Syncs all pending actions
 */
export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }
  
  let synced = 0;
  let failed = 0;
  const remainingQueue: PendingAction[] = [];
  
  for (const action of queue) {
    try {
      await processAction(action);
      synced++;
    } catch (error) {
      console.error(`[Sync] Failed to process action ${action.id}:`, error);
      failed++;
      remainingQueue.push(action);
    }
  }
  
  saveQueue(remainingQueue);
  
  return { synced, failed };
}

/**
 * Processes a single action
 */
async function processAction(action: PendingAction): Promise<void> {
  // For now, we're using localStorage for notes, so no API call needed
  // In the future, this would call the backend API
  
  switch (action.type) {
    case "note_create":
    case "note_update":
      // Notes are already in localStorage, just mark as synced
      console.log(`[Sync] Processed ${action.type}:`, action.data.title);
      break;
      
    case "note_delete":
      console.log(`[Sync] Processed ${action.type}:`, action.data.id);
      break;
      
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Clears the sync queue
 */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Gets the count of pending actions
 */
export function getPendingCount(): number {
  return getQueue().length;
}
