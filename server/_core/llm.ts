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

const DEFAULT_MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

/** Calls the OpenAI-compatible chat completions endpoint, with retry and timeout handling. */
export async function invokeLLM(params: InvokeLLMParams): Promise<LLMResponse> {
  const body = {
    model: params.model ?? DEFAULT_MODEL,
    messages: params.messages,
    temperature: params.temperature ?? 0.2,
    ...(params.response_format ? { response_format: params.response_format } : {}),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${ENV.forgeApiUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.forgeApiKey}`,
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
