import { NextRequest, NextResponse } from "next/server";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { lookupAdmissionsRole } from "@/lib/admissions/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 4 * 1024;
const INVALID_BODY_MESSAGE = "Correo y contraseña son obligatorios.";
const BAD_CREDENTIALS_MESSAGE = "Credenciales inválidas.";
const RATE_LIMITED_MESSAGE = "Demasiados intentos. Espere unos minutos e intente de nuevo.";
const UNAVAILABLE_MESSAGE =
  "El servicio no está disponible en este momento. Intente de nuevo más tarde.";
const NO_ACCESS_MESSAGE = "Esta cuenta no tiene acceso a este módulo.";

/**
 * Auth codes that are about the account or what was typed. They share one answer, so that
 * nobody can tell whether an account exists or what state it is in.
 */
const CREDENTIAL_ERROR_CODES = new Set([
  "invalid_credentials",
  "email_not_confirmed",
  "user_banned",
  "user_not_found",
  "validation_failed",
]);

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1),
});

/** Reads the body as text, stopping as soon as it exceeds the limit. */
async function readBodyWithLimit(request: NextRequest, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function parseCredentials(raw: string | null) {
  if (raw === null) return null;
  try {
    const parsed = credentialsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function isCredentialError({ code, status }: AuthError) {
  const isClientError = status !== undefined && status >= 400 && status < 500;
  return isClientError && code !== undefined && CREDENTIAL_ERROR_CODES.has(code);
}

/** Anything not recognized reads as an outage: never as success, and never as a wrong password. */
function signInFailureResponse(error: AuthError) {
  if (error.status !== 429 && isCredentialError(error)) {
    return NextResponse.json({ error: BAD_CREDENTIALS_MESSAGE }, { status: 401 });
  }

  // Only the code and status: Auth messages can carry personal data.
  console.error(
    "[admissions] Sign-in failed:",
    error.code ?? "no code",
    error.status ?? "no status"
  );
  return error.status === 429
    ? NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 })
    : NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 });
}

/**
 * Local scope ends only this session: the Auth project is shared with other modules.
 * A failure here must not change the denial, so it is only logged, by code.
 */
async function endSession(auth: SupabaseClient["auth"]) {
  try {
    const { error } = await auth.signOut({ scope: "local" });
    if (error) console.error("[admissions] Sign-out failed:", error.code ?? "unknown");
  } catch {
    console.error("[admissions] Sign-out failed:", "exception");
  }
}

export async function POST(request: NextRequest) {
  try {
    const credentials = parseCredentials(await readBodyWithLimit(request, MAX_BODY_BYTES));
    if (!credentials) {
      return NextResponse.json({ error: INVALID_BODY_MESSAGE }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) return signInFailureResponse(error);
    if (!data.user) {
      return NextResponse.json({ error: BAD_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    const lookup = await lookupAdmissionsRole(supabase);
    if (lookup.status !== "role") {
      await endSession(supabase.auth);
      return lookup.status === "failed"
        ? NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 })
        : NextResponse.json({ error: NO_ACCESS_MESSAGE }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 });
  }
}
