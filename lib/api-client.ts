// Small fetch wrapper used by client components to call the API routes.

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, { method = "GET", body, signal }: ApiFetchOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError("Could not reach the server. Check your connection and try again.", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // The session expired. A full page load (not a client-side navigation)
    // discards whatever the previous session left on screen.
    if (response.status === 401 && !path.startsWith("/api/auth/login")) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
    throw new ApiClientError(
      payload?.error?.message ?? "Something went wrong. Please try again.",
      response.status,
      payload?.error?.fieldErrors ?? {},
    );
  }

  return payload.data as T;
}

/** A message that is safe to show in a toast for any thrown value. */
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.";
}
