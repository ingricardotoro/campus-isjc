import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LOAD_ERROR, fetchAdminJson, requestAdmin } from "./admin-fetch";

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

describe("requestAdmin", () => {
  it("returns the status and the JSON body, asking for a fresh copy", async () => {
    respondWith(404, { error: "Prospecto no encontrado." });
    await expect(requestAdmin("/api/x")).resolves.toEqual({
      kind: "response",
      status: 404,
      body: { error: "Prospecto no encontrado." },
    });
    expect(fetch).toHaveBeenCalledWith("/api/x", expect.objectContaining({ cache: "no-store" }));
  });

  it("sends a JSON body with its content type", async () => {
    respondWith(200, { ok: true });
    await requestAdmin("/api/x", { method: "PATCH", json: { statusId: "s" } });
    expect(fetch).toHaveBeenCalledWith(
      "/api/x",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ statusId: "s" }),
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("leaves the body undefined when it is not JSON", async () => {
    respondWith(502, "<html>Bad gateway</html>");
    await expect(requestAdmin("/api/x")).resolves.toEqual({
      kind: "response",
      status: 502,
      body: undefined,
    });
  });

  it("reports network failures and aborts apart from answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );
    await expect(requestAdmin("/api/x")).resolves.toEqual({ kind: "network" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      })
    );
    await expect(requestAdmin("/api/x")).resolves.toEqual({ kind: "aborted" });
  });
});
