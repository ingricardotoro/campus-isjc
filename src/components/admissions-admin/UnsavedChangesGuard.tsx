"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/** A way out of the page that waits for confirmation while there are unsaved changes. */
export type LeaveRequest = {
  /** The label of the button that leaves anyway, such as "Salir sin guardar". */
  proceedLabel: string;
  proceed: () => void;
};

type UnsavedChangesGuard = {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  /** The way out waiting for confirmation, if any. */
  pendingLeave: LeaveRequest | null;
  /** True when the request was held for confirmation; false means the caller may go ahead. */
  requestLeave: (request: LeaveRequest) => boolean;
  cancelLeave: () => void;
  confirmLeave: () => void;
};

// Without a provider nothing is ever held, so the panel links behave as plain links.
const UnsavedChangesContext = createContext<UnsavedChangesGuard>({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
  pendingLeave: null,
  requestLeave: () => false,
  cancelLeave: () => {},
  confirmLeave: () => {},
});

/**
 * Shared by the panel layout, so the sidebar links and logout can wait for the confirmation
 * that the record page shows. The record page reports its unsaved changes here.
 */
export const UnsavedChangesProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasUnsavedChanges, setHasUnsaved] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<LeaveRequest | null>(null);
  // The control that asked to leave gets focus back when the user keeps editing.
  const triggerRef = useRef<HTMLElement | null>(null);

  const setHasUnsavedChanges = useCallback((value: boolean) => {
    setHasUnsaved(value);
    if (!value) setPendingLeave(null);
  }, []);

  const requestLeave = useCallback(
    (request: LeaveRequest) => {
      if (!hasUnsavedChanges) return false;
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPendingLeave(request);
      return true;
    },
    [hasUnsavedChanges]
  );

  const cancelLeave = useCallback(() => {
    setPendingLeave(null);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    // The confirmation leaves the page on the next render; focus the trigger after it.
    if (trigger) requestAnimationFrame(() => trigger.focus());
  }, []);

  const confirmLeave = useCallback(() => {
    const request = pendingLeave;
    setPendingLeave(null);
    triggerRef.current = null;
    request?.proceed();
  }, [pendingLeave]);

  const value = useMemo(
    () => ({
      hasUnsavedChanges,
      setHasUnsavedChanges,
      pendingLeave,
      requestLeave,
      cancelLeave,
      confirmLeave,
    }),
    [hasUnsavedChanges, setHasUnsavedChanges, pendingLeave, requestLeave, cancelLeave, confirmLeave]
  );

  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>;
};

export function useUnsavedChangesGuard() {
  return useContext(UnsavedChangesContext);
}

/** Reports a page's unsaved changes to the panel, and clears them when the page unmounts. */
export function useReportUnsavedChanges(hasUnsavedChanges: boolean) {
  const { setHasUnsavedChanges } = useUnsavedChangesGuard();
  useEffect(() => {
    setHasUnsavedChanges(hasUnsavedChanges);
    return () => setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, setHasUnsavedChanges]);
}

/** A click that opens the link elsewhere (new tab or window) leaves nothing unsaved behind. */
export function isPlainClick(event: React.MouseEvent) {
  return (
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}
