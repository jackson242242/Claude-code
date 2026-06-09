/**
 * Shared types for the Matchday26 AI concierge.
 * Imported by both the server route (`src/app/api/assistant/route.ts`) and the
 * client widget (`src/components/ChatWidget.tsx`), so keep it dependency-free.
 */

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Shape returned by POST /api/assistant. */
export interface AssistantResponse {
  /** The assistant's reply text (always present on a 200). */
  reply?: string;
  /** True when no ANTHROPIC_API_KEY is configured and a canned reply was served. */
  degraded?: boolean;
  /** Present on a non-2xx response, mirroring the backend error contract. */
  error?: { message: string; type: string };
}
