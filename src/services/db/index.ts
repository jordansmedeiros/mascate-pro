// Use the API client database service
import { getDatabase as getApiDatabase, closeDatabase as closeApiDatabase } from './api-client';
import type { DatabaseService } from './api-client';

// Export database service functions
export const getDatabase = getApiDatabase;
export const closeDatabase = closeApiDatabase;

// Re-export the DatabaseService type
export type { DatabaseService };
