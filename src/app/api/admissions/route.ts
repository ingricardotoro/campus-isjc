import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadInterestLabels } from "@/lib/admissions/catalog";
import {
  HONEYPOT_FIELD,
  MAX_BODY_BYTES,
  MIN_FILL_TIME_MS,
  STARTED_AT_FIELD,
} from "@/lib/admissions/form-fields";
import { sendAdmissionsNotification } from "@/lib/admissions/notification";
import {
  classifyRegisterError,
  toRegisterParams,
  type RegisterResultRow,
} from "@/lib/admissions/register";
import { admissionsInterestSchema } from "@/lib/admissions/schema";

const INVALID_MESSAGE =
  "Algunos datos no son válidos. Revise el formulario e intente nuevamente.";
const TOO_LARGE_MESSAGE = "La solicitud es demasiado grande.";
const UNEXPECTED_MESSAGE =
  "No pudimos registrar su solicitud en este momento. Intente nuevamente más tarde.";

function ok() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

function fail(status: number, error: string, fields?: string[]) {
  return NextResponse.json(fields ? { ok: false, error, fields } : { ok: false, error }, {
    status,
  });
}

/** Reads the body as text, stopping as soon as it exceeds the limit. */
async function readBodyWithLimit(request: NextRequest, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function looksAutomated(body: Record<string, unknown>): boolean {
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;
  if (honeypot !== undefined && honeypot !== null && typeof honeypot !== "string") return true;

  const startedAt = body[STARTED_AT_FIELD];
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return true;

  // The timestamp comes from the device clock. A negative value means that clock
  // runs ahead of the server, not that the form was filled instantly: discarding
  // it would lose a real family while showing them a success message.
  const elapsed = Date.now() - startedAt;
  return elapsed >= 0 && elapsed < MIN_FILL_TIME_MS;
}

export async function POST(request: NextRequest) {
  const raw = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (raw === null) return fail(413, TOO_LARGE_MESSAGE);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, INVALID_MESSAGE);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail(400, INVALID_MESSAGE);
  }

  // Bots get the same answer as people so they cannot tell they were filtered.
  if (looksAutomated(body as Record<string, unknown>)) return ok();

  const parsed = admissionsInterestSchema.safeParse(body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")))]
      .filter((field) => field !== "");
    return fail(400, INVALID_MESSAGE, fields);
  }
  const input = parsed.data;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc(
      "admissions_register_public_interest",
      toRegisterParams(input)
    );

    if (error) {
      const kind = classifyRegisterError(error);
      if (kind === "invalid_input") {
        // The RPC message names the rejected rule, never personal data.
        console.warn("[admissions] Registration rejected by RPC:", error.message);
        return fail(400, INVALID_MESSAGE);
      }
      console.error("[admissions] Registration RPC failed:", error.code ?? "unknown");
      return fail(500, UNEXPECTED_MESSAGE);
    }

    const row = (Array.isArray(data) ? data[0] : data) as RegisterResultRow | null | undefined;
    if (row?.is_new_prospect) {
      const labels = await loadInterestLabels(admin, input);
      await sendAdmissionsNotification(input, labels);
    }

    // Identical for new and repeat registrations: the response never reveals
    // whether the family was already known.
    return ok();
  } catch (error) {
    console.error(
      "[admissions] Registration failed:",
      error instanceof Error ? error.name : "unknown"
    );
    return fail(500, UNEXPECTED_MESSAGE);
  }
}
