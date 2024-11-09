export interface Context {
  context_id: string;
  name: string;
  description?: string;
}

export interface Session {
  session_id: number;
  context_id: string;
  start_time: string;
  end_time?: string;
}

export interface SessionEvent {
  event_id: number;
  session_id: number;
  timestamp: string;
  event_type: string;
  event_data: any;
}

export interface SessionSummary {
  overview: string;
  key_topics: string[];
  learning_highlights: string[];
  resources_used: string[];
  conclusion: string;
} 