/**
 * Context Manager - Zarządzanie buforowaną pamięcią dynamiczną
 * Zapobiega przeładowaniu kontekstu poprzez:
 * 1. Auto-summarization długich konwersacji
 * 2. Sliding window dla historii czatu
 * 3. Priorytetyzacja najważniejszych informacji
 * 4. Kompresja starszych wiadomości
 */

import { Message } from "./llm";

export interface ContextWindow {
  messages: Message[];
  totalTokens: number;
  summary?: string;
  compressionRatio: number;
}

export interface ContextManagerConfig {
  maxTokens: number; // Maksymalna liczba tokenów w kontekście
  maxMessages: number; // Maksymalna liczba wiadomości
  summaryThreshold: number; // Próg tokenów do auto-summarization
  priorityKeywords: string[]; // Słowa kluczowe do priorytetyzacji
}

// Domyślna konfiguracja dla Stefana
const DEFAULT_CONFIG: ContextManagerConfig = {
  maxTokens: 50000, // Gemini 3 ma 1M input, ale używamy 50k dla bezpieczeństwa
  maxMessages: 50, // Maksymalnie 50 wiadomości w historii
  summaryThreshold: 30000, // Summarize po 30k tokenów
  priorityKeywords: [
    "ustawa",
    "artykuł",
    "paragraf",
    "Dz. U.",
    "ISAP",
    "Ordynacja podatkowa",
    "VAT",
    "PIT",
    "CIT",
    "interpretacja podatkowa",
  ],
};

/**
 * Szacuje liczbę tokenów w wiadomości
 * Przybliżona formuła: 1 token ≈ 4 znaki dla polskiego tekstu
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Oblicza całkowitą liczbę tokenów w historii
 */
function calculateTotalTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    const content = Array.isArray(msg.content)
      ? msg.content.map(c => (typeof c === "string" ? c : c.type === "text" ? c.text : "")).join(" ")
      : typeof msg.content === "string"
      ? msg.content
      : "";
    return total + estimateTokens(content);
  }, 0);
}

/**
 * Sprawdza czy wiadomość zawiera priorytetowe informacje
 */
function hasPriorityContent(message: Message, keywords: string[]): boolean {
  const content = Array.isArray(message.content)
    ? message.content.map(c => (typeof c === "string" ? c : c.type === "text" ? c.text : "")).join(" ")
    : typeof message.content === "string"
    ? message.content
    : "";

  return keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * Kompresuje wiadomość do krótkiego podsumowania
 */
function compressMessage(message: Message): Message {
  const content = Array.isArray(message.content)
    ? message.content.map(c => (typeof c === "string" ? c : c.type === "text" ? c.text : "")).join(" ")
    : typeof message.content === "string"
    ? message.content
    : "";

  // Skompresuj do pierwszych 100 znaków + "..."
  const compressed = content.length > 100 ? content.substring(0, 100) + "..." : content;

  return {
    ...message,
    content: `[SKOMPRESOWANO] ${compressed}`,
  };
}

/**
 * Zarządza kontekstem konwersacji
 */
export class ContextManager {
  private config: ContextManagerConfig;

  constructor(config?: Partial<ContextManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Przetwarza historię wiadomości i zwraca zoptymalizowany kontekst
   */
  processMessages(messages: Message[]): ContextWindow {
    let processedMessages = [...messages];
    let totalTokens = calculateTotalTokens(processedMessages);

    // 1. Jeśli przekroczono maxMessages, usuń najstarsze (z wyjątkiem system prompt)
    if (processedMessages.length > this.config.maxMessages) {
      const systemMessages = processedMessages.filter(m => m.role === "system");
      const otherMessages = processedMessages.filter(m => m.role !== "system");
      
      // Zachowaj tylko ostatnie maxMessages-1 wiadomości (+ system prompt)
      const trimmedMessages = otherMessages.slice(-(this.config.maxMessages - systemMessages.length));
      processedMessages = [...systemMessages, ...trimmedMessages];
      totalTokens = calculateTotalTokens(processedMessages);
    }

    // 2. Jeśli przekroczono maxTokens, kompresuj starsze wiadomości
    if (totalTokens > this.config.maxTokens) {
      const systemMessages = processedMessages.filter(m => m.role === "system");
      const otherMessages = processedMessages.filter(m => m.role !== "system");

      // Kompresuj starsze wiadomości (pierwsza połowa)
      const midpoint = Math.floor(otherMessages.length / 2);
      const oldMessages = otherMessages.slice(0, midpoint);
      const recentMessages = otherMessages.slice(midpoint);

      // Kompresuj tylko te, które nie mają priorytetowej treści
      const compressedOld = oldMessages.map(msg =>
        hasPriorityContent(msg, this.config.priorityKeywords) ? msg : compressMessage(msg)
      );

      processedMessages = [...systemMessages, ...compressedOld, ...recentMessages];
      totalTokens = calculateTotalTokens(processedMessages);
    }

    // 3. Jeśli nadal przekroczono maxTokens, usuń najstarsze niepriorytetowe
    if (totalTokens > this.config.maxTokens) {
      const systemMessages = processedMessages.filter(m => m.role === "system");
      const otherMessages = processedMessages.filter(m => m.role !== "system");

      // Sortuj według priorytetu (priorytetowe na końcu)
      const sorted = otherMessages.sort((a, b) => {
        const aPriority = hasPriorityContent(a, this.config.priorityKeywords);
        const bPriority = hasPriorityContent(b, this.config.priorityKeywords);
        return aPriority === bPriority ? 0 : aPriority ? 1 : -1;
      });

      // Usuń najstarsze niepriorytetowe, aż zmieścimy się w limicie
      let currentTokens = calculateTotalTokens([...systemMessages, ...sorted]);
      let index = 0;
      while (currentTokens > this.config.maxTokens && index < sorted.length) {
        if (!hasPriorityContent(sorted[index], this.config.priorityKeywords)) {
          sorted.splice(index, 1);
          currentTokens = calculateTotalTokens([...systemMessages, ...sorted]);
        } else {
          index++;
        }
      }

      processedMessages = [...systemMessages, ...sorted];
      totalTokens = calculateTotalTokens(processedMessages);
    }

    // 4. Oblicz compression ratio
    const originalTokens = calculateTotalTokens(messages);
    const compressionRatio = originalTokens > 0 ? totalTokens / originalTokens : 1;

    return {
      messages: processedMessages,
      totalTokens,
      compressionRatio,
    };
  }

  /**
   * Generuje podsumowanie długiej konwersacji
   */
  async summarizeConversation(messages: Message[]): Promise<string> {
    // TODO: Implementacja z użyciem LLM do generowania podsumowania
    // Na razie zwracamy prosty summary
    const totalMessages = messages.length;
    const totalTokens = calculateTotalTokens(messages);
    
    return `Podsumowanie konwersacji: ${totalMessages} wiadomości, ~${totalTokens} tokenów. ` +
           `Główne tematy: analiza prawna, dokumenty, konsultacje.`;
  }

  /**
   * Sprawdza czy kontekst wymaga summarization
   */
  needsSummarization(messages: Message[]): boolean {
    const totalTokens = calculateTotalTokens(messages);
    return totalTokens > this.config.summaryThreshold;
  }
}

// Eksport singleton instance
export const contextManager = new ContextManager();
