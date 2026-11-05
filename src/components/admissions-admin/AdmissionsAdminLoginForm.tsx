"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import styles from "./AdmissionsAdmin.module.scss";
import { ADMIN_HOME_PATH } from "./useAdmissionsLogout";

const FALLBACK_ERROR = "No se pudo iniciar sesión. Intente de nuevo.";
const CONNECTION_ERROR = "Error de conexión. Revise su red e intente de nuevo.";

/** The API message is shown as is for every status it documents: 400, 401, 403, 429, 503, 500. */
async function errorMessageOf(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" && body.error ? body.error : FALLBACK_ERROR;
  } catch {
    return FALLBACK_ERROR;
  }
}

const AdmissionsAdminLoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; attempt: number } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Focus moves to the error on every failed attempt, also when the text repeats.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const fail = (message: string) =>
    setError((previous) => ({ message, attempt: (previous?.attempt ?? 0) + 1 }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admisiones-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // The button stays disabled while the dashboard loads.
        router.replace(ADMIN_HOME_PATH);
        router.refresh();
        return;
      }
      fail(await errorMessageOf(response));
    } catch {
      fail(CONNECTION_ERROR);
    }
    setIsSubmitting(false);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div
        id="login-error"
        ref={errorRef}
        tabIndex={-1}
        aria-live="assertive"
        aria-atomic="true"
        className={error ? styles.formError : undefined}
      >
        {error?.message}
      </div>

      <div className="form-input-box mb-20">
        <div className="form-input-title">
          <label htmlFor="admissions-admin-email">Correo electrónico</label>
        </div>
        <div className="form-input">
          <input
            id="admissions-admin-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
            aria-required="true"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>

      <div className="form-input-box mb-20">
        <div className="form-input-title">
          <label htmlFor="admissions-admin-password">Contraseña</label>
        </div>
        <div className="form-input">
          <input
            id="admissions-admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-required="true"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>

      <div className="bd-sign-btn">
        <button type="submit" className="bd-btn btn-primary w-100" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              Ingresando...
            </>
          ) : (
            "Ingresar"
          )}
        </button>
      </div>
    </form>
  );
};

export default AdmissionsAdminLoginForm;
