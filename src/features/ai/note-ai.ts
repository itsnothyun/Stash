/**
 * Local AI & Heuristic Intelligence Suite for Stash
 *
 * Provides 100% offline zero-network NLP algorithms for summarization, action-item
 * extraction, and tag generation, with optional integration with local Ollama instances.
 */

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
  "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
  "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
  "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more",
  "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
  "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
  "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under",
  "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
  "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom",
  "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
  "your", "yours", "yourself", "yourselves"
]);

export interface ReadingStats {
  words: number;
  characters: number;
  sentences: number;
  readingTimeMinutes: number;
  estimatedGradeLevel: string;
}

export interface ExtractedActionItem {
  text: string;
  confidence: "high" | "medium";
}

export interface AIAnalysisResult {
  summary: string[];
  actionItems: ExtractedActionItem[];
  suggestedTags: string[];
  stats: ReadingStats;
}

/**
 * Computes reading stats & complexity without external libraries.
 */
export function computeReadingStats(text: string): ReadingStats {
  const clean = text.trim();
  if (!clean) {
    return {
      words: 0,
      characters: 0,
      sentences: 0,
      readingTimeMinutes: 0,
      estimatedGradeLevel: "N/A",
    };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characters = clean.length;
  const sentenceMatches = clean.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentenceMatches.length);

  // Avg reading speed ~ 200 words per minute
  const readingTimeMinutes = Math.max(0.5, Math.round((wordCount / 200) * 10) / 10);

  // Simplified Coleman-Liau reading index: 0.0588*L - 0.296*S - 15.8
  const L = (characters / wordCount) * 100;
  const S = (sentenceCount / wordCount) * 100;
  const index = Math.round(0.0588 * L - 0.296 * S - 15.8);

  let estimatedGradeLevel = "Grade 6-8 (Standard)";
  if (index <= 5) estimatedGradeLevel = "Elementary (Easy)";
  else if (index <= 9) estimatedGradeLevel = "Grade 9-10 (Conversational)";
  else if (index <= 12) estimatedGradeLevel = "Grade 11-12 (Technical)";
  else estimatedGradeLevel = "College / Academic";

  return {
    words: wordCount,
    characters,
    sentences: sentenceCount,
    readingTimeMinutes,
    estimatedGradeLevel,
  };
}

/**
 * Extracts key summary points using frequency-weighted sentence ranking (100% offline).
 */
export function extractHeuristicSummary(text: string, maxPoints = 3): string[] {
  const clean = text.trim();
  if (!clean) return [];

  // Split into paragraphs / sentences
  const rawSentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-*•]\s+/, "").replace(/^\[[ xX]\]\s*/, ""))
    .filter((s) => s.length > 20 && !s.startsWith("#") && !s.startsWith("```"));

  if (rawSentences.length <= maxPoints) {
    return rawSentences;
  }

  // Calculate word frequency dictionary
  const words = clean.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  // Score sentences based on word frequency and position weight
  const scored = rawSentences.map((sent, index) => {
    const sentWords = sent.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;
    for (const w of sentWords) {
      if (freq[w]) score += freq[w];
    }
    // Boost leading and concluding sentences
    if (index === 0) score *= 1.4;
    if (index === rawSentences.length - 1) score *= 1.2;

    const normalizedScore = score / Math.max(1, sentWords.length);
    return { sent, score: normalizedScore, index };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, maxPoints);

  // Return sorted in original chronological order
  selected.sort((a, b) => a.index - b.index);
  return selected.map((s) => s.sent);
}

/**
 * Extracts action items / tasks from plain text using linguistic indicators.
 */
export function extractHeuristicActionItems(text: string): ExtractedActionItem[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: ExtractedActionItem[] = [];

  const HIGH_TRIGGERS = [
    /\b(todo|action item|must|need to|have to|ensure|deliver|deadline|follow up|assign to|ship)\b/i,
    /^[-*]\s*\[\s*\]/i,
  ];

  const MEDIUM_TRIGGERS = [
    /\b(should|plan to|verify|review|update|investigate|schedule|reach out|contact|prepare)\b/i,
  ];

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("```")) continue;

    const isHigh = HIGH_TRIGGERS.some((r) => r.test(line));
    if (isHigh) {
      const clean = line.replace(/^[-*+]\s*(\[\s*\])?\s*/, "").replace(/^TODO:?\s*/i, "");
      if (clean.length > 5) {
        results.push({ text: clean, confidence: "high" });
        continue;
      }
    }

    const isMed = MEDIUM_TRIGGERS.some((r) => r.test(line));
    if (isMed) {
      const clean = line.replace(/^[-*+]\s*/, "");
      if (clean.length > 8) {
        results.push({ text: clean, confidence: "medium" });
      }
    }
  }

  return results.slice(0, 10);
}

/**
 * Extracts top keyword concepts suitable for note tags.
 */
export function extractHeuristicTags(text: string, count = 5): string[] {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq: Record<string, number> = {};

  for (const w of words) {
    if (!STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, count).map(([word]) => word);
}

/**
 * Checks if a local Ollama daemon is active on localhost:11434.
 */
export async function checkOllamaStatus(endpoint = "http://localhost:11434"): Promise<{ available: boolean; models: string[] }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${endpoint}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name || m.model) : [];
      return { available: true, models };
    }
  } catch {
    // Offline or unreachable
  }
  return { available: false, models: [] };
}

/**
 * Queries Ollama for LLM generation.
 */
export async function queryOllama(
  endpoint: string,
  model: string,
  prompt: string,
  system?: string
): Promise<string> {
  const res = await fetch(`${endpoint}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      system: system || "You are an intelligent note assistant. Output concise markdown without filler.",
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama returned status ${res.status}`);
  }

  const data = await res.json();
  return data.response?.trim() || "";
}
