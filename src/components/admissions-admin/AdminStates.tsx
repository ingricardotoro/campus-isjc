"use client";

import React from "react";
import styles from "./AdmissionsAdmin.module.scss";
import { useAdmissionsLogout } from "./useAdmissionsLogout";

export const LoadingState = ({ label }: { label: string }) => (
  <div className={styles.stateBox} role="status">
    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
    {label}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className={`${styles.stateBox} ${styles.errorBox}`} role="alert">
    <p className="mb-15">{message}</p>
    <button type="button" className="bd-btn btn-primary" onClick={onRetry}>
      Reintentar
    </button>
  </div>
);

export const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.stateBox}>{children}</div>
);

/** Shown when an API answers 403: the session is valid but the account has no role. */
export const NoAccessState = () => {
  const { logout, isLoggingOut } = useAdmissionsLogout();
  return (
    <div className={`${styles.stateBox} ${styles.errorBox}`} role="alert">
      <p className="mb-15">
        Su cuenta no tiene acceso a este módulo. Si cree que es un error, comuníquese con la
        administración.
      </p>
      <button type="button" className="bd-btn btn-primary" onClick={logout} disabled={isLoggingOut}>
        {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </div>
  );
};
