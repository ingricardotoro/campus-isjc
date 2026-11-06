"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import type { AdmissionsDashboard } from "@/lib/admissions/admin-queries";
import { listHref } from "@/lib/admissions/admin-list-params";
import { fetchAdminJson } from "./admin-fetch";
import { EmptyState, ErrorState, LoadingState, NoAccessState } from "./AdminStates";
import styles from "./AdmissionsAdmin.module.scss";
import { ADMIN_LOGIN_PATH } from "./useAdmissionsLogout";

type DashboardState =
  | { kind: "loading" }
  | { kind: "ready"; data: AdmissionsDashboard }
  | { kind: "error"; message: string }
  | { kind: "forbidden" };

const CountCard = ({
  href,
  label,
  count,
  hint,
}: {
  href: string;
  label: string;
  count: number;
  hint?: string;
}) => (
  <Link href={href} className={`bd-dashboard-card-wrapper ${styles.countCard}`}>
    <span className={styles.countLabel}>{label}</span>
    <span className={styles.countValue}>
      {count}
      <span className="visually-hidden"> {count === 1 ? "solicitud" : "solicitudes"}</span>
    </span>
    {hint && <span className={styles.countHint}>{hint}</span>}
  </Link>
);

const AdmissionsDashboardMain = () => {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });

    fetchAdminJson<AdmissionsDashboard>("/api/admisiones-admin/dashboard", {
      signal: controller.signal,
    }).then((result) => {
      if (result.kind === "aborted") return;
      if (result.kind === "unauthenticated") router.replace(ADMIN_LOGIN_PATH);
      else if (result.kind === "forbidden") setState({ kind: "forbidden" });
      else if (result.kind === "error") setState({ kind: "error", message: result.message });
      else setState({ kind: "ready", data: result.data });
    });

    return () => controller.abort();
  }, [reloadKey, router]);

  const renderBody = () => {
    if (state.kind === "loading") return <LoadingState label="Cargando resumen..." />;
    if (state.kind === "forbidden") return <NoAccessState />;
    if (state.kind === "error") return <ErrorState message={state.message} onRetry={retry} />;

    const { statuses, newLast7Days, unassigned } = state.data;
    const total = statuses.reduce((sum, status) => sum + status.count, 0);
    if (total === 0) {
      return (
        <EmptyState>
          <p className="mb-0">Todavía no hay solicitudes registradas.</p>
        </EmptyState>
      );
    }

    return (
      <>
        <section aria-labelledby="dashboard-followup-title" className="mt-30">
          <h3 id="dashboard-followup-title" className={styles.sectionTitle}>
            Seguimiento
          </h3>
          <div className="row g-3">
            <div className="col-sm-6">
              <CountCard
                href={listHref({})}
                label="Nuevas en los últimos 7 días"
                count={newLast7Days}
                hint="La lista se abre ordenada de la más reciente a la más antigua."
              />
            </div>
            <div className="col-sm-6">
              <CountCard
                href={listHref({ assignedTo: "unassigned" })}
                label="Sin asignar"
                count={unassigned}
                hint="Incluye solicitudes cerradas."
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="dashboard-status-title" className="mt-30">
          <h3 id="dashboard-status-title" className={styles.sectionTitle}>
            Por estado
          </h3>
          <ul className={`row g-3 ${styles.plainList}`}>
            {statuses.map((status) => (
              <li key={status.id} className="col-sm-6 col-xl-4">
                <CountCard
                  href={listHref({ statusId: status.id })}
                  label={status.name}
                  count={status.count}
                />
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  };

  return (
    <div className="bd-dashboard-inner">
      <div className="bd-dashboard-title-inner">
        <h2 className="bd-dashboard-title h4">Resumen de solicitudes</h2>
      </div>
      {renderBody()}
    </div>
  );
};

export default AdmissionsDashboardMain;
