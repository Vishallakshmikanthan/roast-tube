// src/lib/llm/router.ts
import { AppError } from "@/lib/errors";
import type { Provider } from "./providers";
import { redis } from "@/lib/redis";
import { env } from "@/lib/env";

export class ProviderError extends Error {
  constructor(public provider: string, public status: number) {
    super(`Provider ${provider} returned HTTP ${status}`);
    this.name = "ProviderError";
  }
}

export async function chat(
  p: Provider,
  system: string,
  user: string
): Promise<string> {
  const res = await fetch(`${p.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${p.apiKey}`,
    },
    body: JSON.stringify({
      model: p.model,
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 1000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(p.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(p.timeoutMs),
  });

  if (!res.ok) {
    throw new ProviderError(p.name, res.status);
  }

  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

// Circuit breaker helpers
export async function isOpen(provider: string): Promise<boolean> {
  try {
    if (!redis) return false;
    const key = `cb:${provider}`;
    const val = await redis.get(key);
    return Boolean(val);
  } catch {
    return false;
  }
}

export async function recordFailure(
  provider: string,
  _error?: unknown
): Promise<void> {
  try {
    if (!redis) return;
    const failKey = `fail:${provider}`;
    const failures = await redis.incr(failKey);
    if (failures === 1) {
      await redis.expire(failKey, 60);
    }
    if (failures >= 3) {
      await redis.set(`cb:${provider}`, "1", { ex: 60 });
    }
  } catch {
    // Ignore cache failure
  }
}

export async function resetCircuit(provider: string): Promise<void> {
  try {
    if (!redis) return;
    await redis.del(`cb:${provider}`);
    await redis.del(`fail:${provider}`);
  } catch {
    // Ignore cache failure
  }
}

// Global daily counter helper
export async function bumpGlobalCounter(): Promise<number> {
  try {
    if (!redis) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const key = `llm:day:${today}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 26 * 3600); // 26 hours TTL
    }
    const cap = env.GLOBAL_LLM_DAILY_CAP || 1000;
    if (count > cap) {
      throw new AppError(
        "CAPACITY",
        "Roaster is exhausted for today. Come back tomorrow.",
        503
      );
    }
    return count;
  } catch (e) {
    if (e instanceof AppError) throw e;
    return 0;
  }
}
