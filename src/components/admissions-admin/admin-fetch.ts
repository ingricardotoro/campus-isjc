// Client fetch for the admissions admin APIs. It turns every answer into one of a few
// outcomes the pages can render: data, sign in again, no access, or an error to retry.

export const DEFAULT_LOAD_ERROR = "No se pudieron cargar los datos.";
export const CONNECTION_ERROR = "Error de conexión. Revise su red e intente de nuevo.";

export type AdminFetchResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "aborted" };

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function apiMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { error } = body as { error?: unknown };
  return typeof error === "string" && error ? error : null;
}

export async function fetchAdminJson<T>(
  url: string,
  init: RequestInit = {}
): Promise<AdminFetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return { kind: "aborted" };
    return { kind: "error", message: CONNECTION_ERROR };
  }

  if (response.status === 401) return { kind: "unauthenticated" };
  if (response.status === 403) return { kind: "forbidden" };

  const body = await readJson(response);
  if (!response.ok || body === undefined) {
    return { kind: "error", message: apiMessage(body) ?? DEFAULT_LOAD_ERROR };
  }
  return { kind: "ok", data: body as T };
}

export type AdminRequestResult =
  | { kind: "response"; status: number; body: unknown }
  | { kind: "network" }
  | { kind: "aborted" };

/**
 * Lower-level fetch for pages that must tell answers apart by status, such as a 404 or
 * the field errors of a 400. The body is undefined when it is not JSON.
 */
export async function requestAdmin(
  url: string,
  { json, ...init }: RequestInit & { json?: unknown } = {}
): Promise<AdminRequestResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      ...(json !== undefined && {
        body: JSON.stringify(json),
        headers: { "Content-Type": "application/json" },
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return { kind: "aborted" };
    return { kind: "network" };
  }
  return { kind: "response", status: response.status, body: await readJson(response) };
}
