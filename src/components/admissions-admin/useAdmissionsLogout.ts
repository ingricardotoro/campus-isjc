"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export const ADMIN_HOME_PATH = "/admisiones-admin";
export const ADMIN_LOGIN_PATH = "/admisiones-admin/login";

const LOGOUT_FAILED_MESSAGE = "No se pudo cerrar la sesión. Intente de nuevo.";

/**
 * Ends the session and goes to the login page. A 401 or 403 still goes there: the session is
 * already gone or has no access. Any other failure stays put, because the session may still
 * be live and the login page would wrongly suggest it ended.
 */
export function useAdmissionsLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/admisiones-admin/logout", { method: "POST" });
      if (response.ok || response.status === 401 || response.status === 403) {
        router.replace(ADMIN_LOGIN_PATH);
        router.refresh();
        return;
      }
      toast.error(LOGOUT_FAILED_MESSAGE);
    } catch {
      toast.error(LOGOUT_FAILED_MESSAGE);
    }
    setIsLoggingOut(false);
  }, [router]);

  return { logout, isLoggingOut };
}
