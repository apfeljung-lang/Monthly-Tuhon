// Firebase is currently disabled in favor of local storage mode.
// This file remains as a placeholder for potential future configuration.

export const isConfigMissing = true;
export const missingConfigKeys = ['VITE_FIREBASE_API_KEY'];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Local Mode Error [${operationType}] at ${path}:`, error);
}

// Mock auth object to prevent crashes in components that still import it
export const auth = {
  currentUser: null
};

export const db = {};
