// src/lib/llm/providers.ts
import { env } from "@/lib/env";
import type { Lang } from "@/lib/prompts/schema";

export type Provider = {
  name: "nim" | "groq" | "gemini";
  baseURL: string;
  apiKey: string;
  model: string;
  jsonMode: boolean;
  timeoutMs: number;
};

export function getProviders(): Record<string, Provider> {
  const out: Record<string, Provider> = {};
  if (env.NIM_API_KEY && env.NIM_BASE_URL && env.NIM_MODEL) {
    out.nim = {
      name: "nim",
      baseURL: env.NIM_BASE_URL,
      apiKey: env.NIM_API_KEY,
      model: env.NIM_MODEL,
      jsonMode: false,
      timeoutMs: 25000,
    };
  }
  if (env.GROQ_API_KEY && env.GROQ_BASE_URL && env.GROQ_MODEL) {
    out.groq = {
      name: "groq",
      baseURL: env.GROQ_BASE_URL,
      apiKey: env.GROQ_API_KEY,
      model: env.GROQ_MODEL,
      jsonMode: true,
      timeoutMs: 20000,
    };
  }
  if (env.GEMINI_API_KEY && env.GEMINI_BASE_URL && env.GEMINI_MODEL) {
    out.gemini = {
      name: "gemini",
      baseURL: env.GEMINI_BASE_URL,
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
      jsonMode: true,
      timeoutMs: 25000,
    };
  }
  return out;
}

export const routeFor = (lang: Lang): string[] => {
  const raw =
    lang === "en"
      ? env.ROUTE_EN
      : lang === "tanglish"
      ? env.ROUTE_TANGLISH
      : env.ROUTE_HINGLISH;
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};
