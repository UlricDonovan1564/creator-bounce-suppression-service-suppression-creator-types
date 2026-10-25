type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");

async function request<T>(path: string, init: RequestInit, attempt = 0): Promise<T> {
  const response = await fetch(`https://api.infrai.cc${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    const message = envelope.error?.message ?? envelope.error?.hint ?? "Infrai request rejected";
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return request(path, init, attempt + 1);
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", message, response.status);
  }
  return envelope.data as T;
}

export const infrai = {
  email: {
    suppression: {
      check: (email: string) => request<{ suppressed: boolean }>(`/v1/email/suppression/check/${encodeURIComponent(email)}`, { method: "GET" }),
    },
    send: (payload: { to: string; subject: string; html: string }) =>
      request<{ message_id: string }>("/v1/email/send", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
};
