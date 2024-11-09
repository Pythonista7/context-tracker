// Add this import at the top of the file
import fetch from 'node-fetch';  // For Node < 18
// OR
// import { fetch } from 'undici';  // For Node ≥ 18

// src/api.ts
const API_BASE = 'http://localhost:5001';

import { Context, Session, SessionEvent, SessionSummary } from './types';

class ApiClient {
  private async fetchApi<T>(endpoint: string, options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json() as Promise<T>;
  }

  async createContext(name: string, description?: string): Promise<Context> {
    return this.fetchApi('/context', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async startSession(contextId: string): Promise<Session> {
    return this.fetchApi('/session', {
      method: 'POST',
      body: JSON.stringify({ context_id: contextId }),
    });
  }

  async endSession(sessionId: number): Promise<void> {
    return this.fetchApi(`/session/${sessionId}/end`, {
      method: 'POST',
    });
  }

  async getSessionEvents(sessionId: number): Promise<SessionEvent[]> {
    return this.fetchApi(`/session/${sessionId}/events`);
  }

  async generateSummary(sessionId: number): Promise<SessionSummary> {
    return this.fetchApi(`/session/${sessionId}/summary`);
  }

  async getActiveSessions(): Promise<{ active_sessions: Session[]; count: number }> {
    return this.fetchApi('/sessions/active');
  }

  async getContexts(): Promise<Context[]> {
    return this.fetchApi('/context/list');
  }
}

// Export singleton instance
export const api = new ApiClient();