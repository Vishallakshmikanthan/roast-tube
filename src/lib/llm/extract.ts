// src/lib/llm/extract.ts
export function extractJson(text: string): unknown {
  if (!text || typeof text !== "string") {
    throw new Error("no json");
  }

  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a < 0 || b <= a) {
    throw new Error("no json");
  }

  return JSON.parse(cleaned.slice(a, b + 1));
}
