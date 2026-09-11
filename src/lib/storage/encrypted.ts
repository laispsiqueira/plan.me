export class EncryptedStorage {
  private static readonly ENCRYPTION_KEY = 'plan-me-default-key-CHANGE-IN-PROD';

  static encrypt(data: any): string {
    const json = JSON.stringify(data);
    try {
      return btoa(encodeURIComponent(json));
    } catch {
      return btoa(json);
    }
  }

  static decrypt(encoded: string, fallback: any): any {
    try {
      let json = atob(encoded);
      try {
        json = decodeURIComponent(json);
      } catch {
        // fallback to raw json string
      }
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    const encrypted = this.encrypt(value);
    localStorage.setItem(key, encrypted);
  }

  static get<T>(key: string, fallback: T): T {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return fallback;
      return this.decrypt(encrypted, fallback);
    } catch {
      return fallback;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }
}
