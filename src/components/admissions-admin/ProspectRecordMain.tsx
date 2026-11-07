"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AdmissionsAdminCatalogs } from "@/lib/admissions/admin-queries";
import { type AdmissionsMe, LIST_QUERY_PARAM, backToListHref } from "@/lib/admissions/admin-record";
import {
  type RecordLoad,
  type RecordPageState,
  afterSaveStep,
  resolveRecordLoad,
} from "@/lib/admissions/admin-record-state";
import { fetchAdminJson, requestAdmin } from "./admin-fetch";
import { EmptyState, ErrorState, LoadingState, NoAccessState } from "./AdminStates";
import styles from "./AdmissionsAdmin.module.scss";
import DeleteProspectSection from "./DeleteProspectSection";
import GuardianEditForm from "./GuardianEditForm";
import ProspectEditForm from "./ProspectEditForm";
import {
  ContactLinks,
  DetailList,
  consentRows,
  guardianRows,
  originRows,
  prospectRows,
} from "./ProspectRecordView";
import { type LeaveOutcome, useBeforeUnloadWarning } from "./RecordFormParts";
import { isPlainClick, useReportUnsavedChanges, useUnsavedChangesGuard } from "./UnsavedChangesGuard";
import { ADMIN_LOGIN_PATH } from "./useAdmissionsLogout";

type PageState = { kind: "loading" } | RecordPageState;

type CatalogState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: AdmissionsAdminCatalogs }
  | { kind: "error"; message: string };

type Section = "prospect" | "guardian";

const SAVED_MESSAGES: Record<Section, string> = {
  prospect: "Los cambios de la solicitud se guardaron.",
  guardian: "Los datos del encargado se guardaron.",
};

const CLOSED_EDITORS: Record<Section, boolean> = { prospect: false, guardian: false };

/** Loads the record and the current role together; `resolveRecordLoad` combines the answers. */
async function loadRecord(id: string, signal?: AbortSignal): Promise<RecordLoad> {
  const [detail, me] = await Promise.all([
    requestAdmin(`/api/admisiones-admin/prospects/${id}`, { signal }),
    fetchAdminJson<AdmissionsMe>("/api/admisiones-admin/me", { signal }),
  ]);
  return resolveRecordLoad(detail, me);
}

const ProspectRecordMain = ({ id }: { id: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listHref = backToListHref(searchParams.get(LIST_QUERY_PARAM));

  const [page, setPage] = useState<PageState>({ kind: "loading" });
  const [catalogs, setCatalogs] = useState<CatalogState>({ kind: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [editing, setEditing] = useState<Record<Section, boolean>>(CLOSED_EDITORS);
  const [dirty, setDirty] = useState<Record<Section, boolean>>(CLOSED_EDITORS);
  const [savedMessage, setSavedMessage] = useState<Record<Section, string>>({
    prospect: "",
    guardian: "",
  });
  const { pendingLeave, requestLeave, cancelLeave, confirmLeave } = useUnsavedChangesGuard();
  const leaveNoticeRef = useRef<HTMLDivElement>(null);
  const editButtonRefs = useRef<Record<Section, HTMLButtonElement | null>>({
    prospect: null,
    guardian: null,
  });

  const hasUnsavedChanges = dirty.prospect || dirty.guardian;
  useBeforeUnloadWarning(hasUnsavedChanges);
  useReportUnsavedChanges(hasUnsavedChanges);

  // The confirmation can come from the sidebar, far from this notice: move focus to it.
  useEffect(() => {
    if (pendingLeave) leaveNoticeRef.current?.focus();
  }, [pendingLeave]);

  const canEdit = page.kind === "ready" && page.me.canEdit;

  // Edits that can no longer be saved are dropped, so nothing warns about them any more.
  const leaveRecord = useCallback((next: Exclude<RecordPageState, { kind: "ready" }>) => {
    setEditing(CLOSED_EDITORS);
    setDirty(CLOSED_EDITORS);
    setPage(next);
  }, []);

  // Record and role.
  useEffect(() => {
    const controller = new AbortController();
    setPage({ kind: "loading" });
    loadRecord(id, controller.signal).then((result) => {
      if (result.kind === "aborted") return;
      if (result.kind === "login") router.replace(ADMIN_LOGIN_PATH);
      else setPage(result);
    });
    return () => controller.abort();
  }, [id, reloadKey, router]);

  // Catalogs, only for a role that can edit.
  useEffect(() => {
    if (!canEdit) return;
    const controller = new AbortController();
    setCatalogs({ kind: "loading" });
    fetchAdminJson<AdmissionsAdminCatalogs>("/api/admisiones-admin/catalogs", {
      signal: controller.signal,
    }).then((result) => {
      if (result.kind === "aborted") return;
      if (result.kind === "unauthenticated") router.replace(ADMIN_LOGIN_PATH);
      else if (result.kind === "forbidden") leaveRecord({ kind: "no-access" });
      else if (result.kind === "error") setCatalogs({ kind: "error", message: result.message });
      else setCatalogs({ kind: "ready", data: result.data });
    });
    return () => controller.abort();
  }, [canEdit, catalogReloadKey, router, leaveRecord]);

  const onProspectDirty = useCallback(
    (value: boolean) =>
      setDirty((previous) => (previous.prospect === value ? previous : { ...previous, prospect: value })),
    []
  );
  const onGuardianDirty = useCallback(
    (value: boolean) =>
      setDirty((previous) => (previous.guardian === value ? previous : { ...previous, guardian: value })),
    []
  );

  const closeEditor = (section: Section) => {
    setEditing((previous) => ({ ...previous, [section]: false }));
    setDirty((previous) => ({ ...previous, [section]: false }));
    // The edit button comes back on the next render; focus it then.
    requestAnimationFrame(() => editButtonRefs.current[section]?.focus());
  };

  const openEditor = (section: Section) => {
    setSavedMessage((previous) => ({ ...previous, [section]: "" }));
    cancelLeave();
    setEditing((previous) => ({ ...previous, [section]: true }));
  };

  const handleLeave = (outcome: LeaveOutcome) => {
    if (outcome === "login") router.replace(ADMIN_LOGIN_PATH);
    else leaveRecord({ kind: outcome });
  };

  // After a save the view shows the record as the database now holds it. The form keeps its
  // saving state until the fresh copy arrives, then closes.
  const handleSaved = async (section: Section) => {
    const step = afterSaveStep(await loadRecord(id));
    if (step.kind === "ignore") return;
    if (step.kind === "login") return router.replace(ADMIN_LOGIN_PATH);
    if (step.kind === "leave") return leaveRecord(step.page);

    closeEditor(section);
    setSavedMessage((previous) => ({ ...previous, [section]: SAVED_MESSAGES[section] }));
    if (step.kind === "show") setPage(step.page);
    else toast.error(step.toast);
  };

  const handleBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    if (requestLeave({ proceedLabel: "Salir sin guardar", proceed: () => router.push(listHref) })) {
      event.preventDefault();
    }
  };

  const backLink = (
    <Link href={listHref} className={styles.backLink} onClick={handleBack}>
      <span aria-hidden="true">← </span>Volver a solicitudes
    </Link>
  );

  if (page.kind === "loading") {
    return (
      <div className="bd-dashboard-inner">
        <LoadingState label="Cargando la solicitud..." />
      </div>
    );
  }
  if (page.kind === "no-access") {
    return (
      <div className="bd-dashboard-inner">
        <NoAccessState />
      </div>
    );
  }
  if (page.kind === "not-found") {
    return (
      <div className="bd-dashboard-inner">
        {backLink}
        <EmptyState>
          <h2 className={`h5 ${styles.sectionTitle}`}>Solicitud no encontrada</h2>
          <p className="mb-0">Puede que se haya eliminado o que el enlace no sea correcto.</p>
        </EmptyState>
      </div>
    );
  }
  if (page.kind === "error") {
    return (
      <div className="bd-dashboard-inner">
        {backLink}
        <ErrorState message={page.message} onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    );
  }

  const { detail, me } = page;
  const studentLabel = detail.studentName || "Estudiante sin nombre";

  const editButton = (section: Section, label: string) =>
    canEdit && !editing[section] ? (
      <button
        ref={(element) => {
          editButtonRefs.current[section] = element;
        }}
        type="button"
        className="bd-btn btn-outline-primary"
        onClick={() => openEditor(section)}
      >
        {label}
      </button>
    ) : null;

  const catalogBlock = () => {
    if (catalogs.kind === "error") {
      return (
        <ErrorState
          message="No se pudieron cargar las opciones para editar."
          onRetry={() => setCatalogReloadKey((key) => key + 1)}
        />
      );
    }
    if (catalogs.kind !== "ready") return <LoadingState label="Cargando opciones..." />;
    return (
      <ProspectEditForm
        detail={detail}
        catalogs={catalogs.data}
        onCancel={() => closeEditor("prospect")}
        onSaved={() => handleSaved("prospect")}
        onLeave={handleLeave}
        onDirtyChange={onProspectDirty}
      />
    );
  };

  return (
    <div className="bd-dashboard-inner">
      {backLink}

      {pendingLeave && hasUnsavedChanges && (
        <div ref={leaveNoticeRef} tabIndex={-1} className={`mt-15 ${styles.notice}`} role="alert">
          <p className="mb-10">Tiene cambios sin guardar. Si sale ahora, se perderán.</p>
          <div className={styles.formActions}>
            <button type="button" className="bd-btn btn-primary" onClick={cancelLeave}>
              Seguir editando
            </button>
            <button type="button" className="bd-btn btn-outline-primary" onClick={confirmLeave}>
              {pendingLeave.proceedLabel}
            </button>
          </div>
        </div>
      )}

      <div className={`mt-15 bd-dashboard-title-inner ${styles.recordHeader}`}>
        <h2 className="bd-dashboard-title h4 mb-0">{studentLabel}</h2>
        <span className="bd-badge">{detail.status.name}</span>
        {!me.canEdit && <span className={styles.readOnlyNote}>Solo lectura</span>}
      </div>

      <section className="mt-30" aria-labelledby="prospect-section-title">
        <div className={styles.sectionHeader}>
          <h3 id="prospect-section-title" className={styles.sectionTitle}>
            {editing.prospect ? "Editar solicitud" : "Solicitud"}
          </h3>
          {editButton("prospect", "Editar solicitud")}
        </div>
        <p className={styles.savedNote} role="status">
          {savedMessage.prospect}
        </p>
        {editing.prospect ? catalogBlock() : <DetailList rows={prospectRows(detail)} />}
      </section>

      <section className="mt-30" aria-labelledby="guardian-section-title">
        <div className={styles.sectionHeader}>
          <h3 id="guardian-section-title" className={styles.sectionTitle}>
            {editing.guardian ? "Editar encargado" : "Encargado"}
          </h3>
          {editButton("guardian", "Editar encargado")}
        </div>
        <p className={styles.savedNote} role="status">
          {savedMessage.guardian}
        </p>
        {editing.guardian ? (
          <GuardianEditForm
            detail={detail}
            onCancel={() => closeEditor("guardian")}
            onSaved={() => handleSaved("guardian")}
            onLeave={handleLeave}
            onDirtyChange={onGuardianDirty}
          />
        ) : (
          <>
            <DetailList rows={guardianRows(detail)} />
            <ContactLinks guardian={detail.guardian} />
          </>
        )}
      </section>

      <section className="mt-30" aria-labelledby="consent-section-title">
        <h3 id="consent-section-title" className={styles.sectionTitle}>
          Consentimiento y origen
        </h3>
        <p className={styles.filterHint}>Registro de la solicitud. No se puede modificar.</p>
        <h4 className={`mt-15 ${styles.subsectionTitle}`}>Consentimiento</h4>
        <DetailList rows={consentRows(detail)} />
        <h4 className={`mt-15 ${styles.subsectionTitle}`}>Origen</h4>
        <DetailList rows={originRows(detail)} />
      </section>

      {me.canDelete && (
        <DeleteProspectSection prospectId={detail.id} studentLabel={studentLabel} listHref={listHref} />
      )}
    </div>
  );
};

export default ProspectRecordMain;
