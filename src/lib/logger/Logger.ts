export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  meta?: any;
}

export class Logger {
  static log(level: 'error' | 'warn' | 'info', message: string, meta?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };

    if (typeof window !== 'undefined') {
      console[level]?.(message, meta);
    }

    this.saveToIndexedDB(entry);
  }

  private static async saveToIndexedDB(entry: LogEntry): Promise<void> {
    try {
      if (typeof indexedDB === 'undefined') return;
      const db = await this.openDB();
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');
      store.add(entry);
    } catch {
      // Quiet fail to prevent recursive logging loops
    }
  }

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }
      const request = indexedDB.open('plan-me-logs', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { autoIncrement: true });
        }
      };
    });
  }
}
