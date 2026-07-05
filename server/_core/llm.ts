import { ENV } from "./env";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LLMResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: boolean;
        schema: Record<string, unknown>;
      };
    };

export interface InvokeLLMParams {
  messages: LLMMessage[];
  response_format?: LLMResponseFormat;
  model?: string;
  temperature?: number;
}

export interface LLMResponse {
  choices: Array<{ message: { content: string | null } }>;
}

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

/**
 * Calls a real OpenAI-compatible chat completions endpoint directly
 * (OpenAI, Azure OpenAI, or any compatible relay), with retry and timeout
 * handling. Configured via LLM_API_URL / LLM_API_KEY / LLM_MODEL.
 */
export async function invokeLLM(params: InvokeLLMParams): Promise<LLMResponse> {
  if (!ENV.llmApiKey) {
    throw new Error("[LLM] LLM_API_KEY is not configured.");
  }

  const body = {
    model: params.model ?? ENV.llmModel,
    messages: params.messages,
    temperature: params.temperature ?? 0.2,
    ...(params.response_format ? { response_format: params.response_format } : {}),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${ENV.llmApiUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.llmApiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`[LLM] Request failed with status ${res.status}: ${await res.text()}`);
      }
      return (await res.json()) as LLMResponse;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}
