// Use the browser-compatible database service
import { getDatabase as getBrowserDatabase, closeDatabase as closeBrowserDatabase } from './browser-db';
import type { DatabaseService } from './browser-db';

// Export database service functions
export const getDatabase = getBrowserDatabase;
export const closeDatabase = closeBrowserDatabase;

// Re-export the DatabaseService type
export type { DatabaseService };
