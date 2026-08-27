/**
 * Centralized API & WebSocket Endpoint Configuration
 * Resolves from VITE_API_URL environment variable or falls back to local FastAPI server.
 */

export const BACKEND_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://127.0.0.1:8000';

export const WS_URL: string =
  BACKEND_URL.replace(/^http/, 'ws') + '/ws/telemetry';

export const API_BASE_URL: string = `${BACKEND_URL}/api`;
