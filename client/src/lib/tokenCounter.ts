/**
 * Token Counter - Counts tokens in messages to prevent context overflow
 * Uses tiktoken for accurate token counting (GPT/Gemini compatible)
 */

import { encode } from "gpt-tokenizer";

// Context limits
export const CONTEXT_LIMIT = 250000; // 250k tokens (Stefan's context window for in-depth analysis)
export const WARNING_THRESHOLD = 200000; // 80% of limit
export const CRITICAL_THRESHOLD = 250000; // 100% of limit

interface Message {
  role: string;
  content: string;
}

/**
 * Counts tokens in a single message
 * @param message - Message object with role and content
 * @returns Number of tokens
 */
export function countMessageTokens(message: Message): number {
  try {
    const roleTokens = encode(message.role).length;
    const contentTokens = encode(message.content).length;
    
    // Add 4 tokens for message formatting (role, content, etc.)
    return roleTokens + contentTokens + 4;
  } catch (error) {
    console.error("[Token Counter] Failed to count tokens:", error);
    // Fallback: rough estimate (1 token ≈ 4 characters)
    return Math.ceil((message.role.length + message.content.length) / 4);
  }
}

/**
 * Counts total tokens in message history
 * @param messages - Array of messages
 * @returns Total number of tokens
 */
export function countTotalTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => total + countMessageTokens(msg), 0);
}

/**
 * Checks if context is approaching limit
 * @param tokenCount - Current token count
 * @returns Warning level: "safe" | "warning" | "critical"
 */
export function getContextWarningLevel(tokenCount: number): "safe" | "warning" | "critical" {
  if (tokenCount >= CRITICAL_THRESHOLD) {
    return "critical";
  } else if (tokenCount >= WARNING_THRESHOLD) {
    return "warning";
  }
  return "safe";
}

/**
 * Calculates percentage of context used
 * @param tokenCount - Current token count
 * @returns Percentage (0-100)
 */
export function getContextUsagePercent(tokenCount: number): number {
  return Math.min(100, Math.round((tokenCount / CONTEXT_LIMIT) * 100));
}

/**
 * Gets human-readable context status message
 * @param tokenCount - Current token count
 * @returns Status message
 */
export function getContextStatusMessage(tokenCount: number): string {
  const level = getContextWarningLevel(tokenCount);
  const percent = getContextUsagePercent(tokenCount);
  
  switch (level) {
    case "critical":
      return `⛔ Limit kontekstu osiągnięty (${tokenCount.toLocaleString()} / ${CONTEXT_LIMIT.toLocaleString()} tokenów). Rozpocznij nowy wątek aby uniknąć halucynacji.`;
    case "warning":
      return `⚠️ Kontekst wypełniony w ${percent}% (${tokenCount.toLocaleString()} / ${CONTEXT_LIMIT.toLocaleString()} tokenów). Rozważ rozpoczęcie nowego wątku.`;
    default:
      return `✅ Kontekst: ${tokenCount.toLocaleString()} / ${CONTEXT_LIMIT.toLocaleString()} tokenów (${percent}%)`;
  }
}
