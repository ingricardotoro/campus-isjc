import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOAD_ERROR, fetchAdminJson } from "./admin-fetch";

function respondWith(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(text, { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAdminJson", () => {
  it("returns the data on 200", async () => {
    respondWith(200, { total: 3 });
    await expect(fetchAdminJson("/api/x")).resolves.toEqual({ kind: "ok", data: { total: 3 } });
  });

  it("asks for a fresh copy", async () => {
    respondWith(200, {});
    await fetchAdminJson("/api/x");
    expect(fetch).toHaveBeenCalledWith("/api/x", expect.objectContaining({ cache: "no-store" }));
  });

  it("maps 401 to unauthenticated and 403 to forbidden", async () => {
    respondWith(401, { error: "No autenticado" });
    await expect(fetchAdminJson("/api/x")).resolves.toEqual({ kind: "unauthenticated" });
    respondWith(403, { error: "No autorizado" });
    await expect(fetchAdminJson("/api/x")).resolves.toEqual({ kind: "forbidden" });
  });

  it("uses the API message for other failures", async () => {
    respondWith(500, { error: "No se pudieron cargar los datos." });
    await expect(fetchAdminJson("/api/x")).resolves.toEqual({
      kind: "error",
      message: "No se pudieron cargar los datos.",
    });
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    respondWith(502, "<html>Bad gateway</html>");
    await expect(fetchAdminJson("/api/x")).resolves.toEqual({
      kind: "error",
      message: DEFAULT_LOAD_ERROR,
    });
  });

  it("reports a 200 without a JSON body as an error, never as data", async () => {
    respondWith(200, "not json");
    await expect(fetchAdminJson("/api/x")).resolves.toEqual({
      kind: "error",
      message: DEFAULT_LOAD_ERROR,
    });
  });

  it("reports a network failure as a connection error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );
    const result = await fetchAdminJson("/api/x");
    expect(result.kind).toBe("error");
    expect(result.kind === "error" && result.message).toMatch(/conexión/);
  });

  it("reports an aborted request as aborted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      })
    );
    await expect(fetchAdminJson("/api/x")).resolves.toEqual({ kind: "aborted" });
  });
});
