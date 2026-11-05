"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdmissionsAdminCatalogs, ProspectList } from "@/lib/admissions/admin-queries";
import {
  LIST_PAGE_SIZE,
  type FilterPatch,
  type ListFilters,
  hasActiveFilters,
  listPathFor,
  normalizeSearch,
  pageCount,
  pageItems,
  prospectsApiQuery,
  readListFilters,
  updateFilters,
} from "@/lib/admissions/admin-list-params";
import { fetchAdminJson } from "./admin-fetch";
import { EmptyState, ErrorState, LoadingState, NoAccessState } from "./AdminStates";
import styles from "./AdmissionsAdmin.module.scss";
import { syncSearchFromUrl } from "./search-sync";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "./useAdmissionsLogout";

const SEARCH_DEBOUNCE_MS = 400;

type Loadable<T> =
  | { kind: "loading" }
  | { kind: "ready"; data: T }
  | { kind: "error"; message: string };

type Option = { value: string; label: string };

const SORT_OPTIONS: Option[] = [
  { value: "created_at:desc", label: "Fecha, más recientes primero" },
  { value: "created_at:asc", label: "Fecha, más antiguas primero" },
  { value: "last_contact_at:desc", label: "Último contacto, más reciente primero" },
  { value: "last_contact_at:asc", label: "Último contacto, más antiguo primero" },
  { value: "student_name:asc", label: "Estudiante, de la A a la Z" },
  { value: "student_name:desc", label: "Estudiante, de la Z a la A" },
];

const dateFormatter = new Intl.DateTimeFormat("es-HN", {
  dateStyle: "medium",
  timeZone: "America/Tegucigalpa",
});

function withInactiveMark(name: string, isActive: boolean) {
  return isActive ? name : `${name} (inactivo)`;
}

function catalogOptions(catalogs: AdmissionsAdminCatalogs) {
  return {
    yearId: catalogs.academicYears.map((year) => ({
      value: year.id,
      label: withInactiveMark(year.name, year.isActive),
    })),
    gradeId: [...catalogs.grades]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((grade) => ({ value: grade.id, label: withInactiveMark(grade.name, grade.isActive) })),
    modalityId: catalogs.modalities.map((modality) => ({
      value: modality.id,
      label: withInactiveMark(modality.name, modality.isActive),
    })),
    statusId: [...catalogs.statuses]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((status) => ({ value: status.id, label: withInactiveMark(status.name, status.isActive) })),
    sourceId: catalogs.sources.map((source) => ({
      value: source.id,
      label: withInactiveMark(source.name, source.isActive),
    })),
    campaignId: catalogs.campaigns.map((campaign) => ({
      value: campaign.id,
      label: withInactiveMark(campaign.name, campaign.isActive),
    })),
    assignedTo: [
      { value: "unassigned", label: "Sin asignar" },
      ...catalogs.assignableStaff.map((staff) => ({ value: staff.id, label: staff.name })),
    ],
  };
}

type CatalogOptions = ReturnType<typeof catalogOptions>;

const FILTER_FIELDS: { key: keyof CatalogOptions; label: string; allLabel: string }[] = [
  { key: "yearId", label: "Año lectivo", allLabel: "Todos los años" },
  { key: "gradeId", label: "Grado", allLabel: "Todos los grados" },
  { key: "modalityId", label: "Modalidad", allLabel: "Todas las modalidades" },
  { key: "statusId", label: "Estado", allLabel: "Todos los estados" },
  { key: "sourceId", label: "Origen", allLabel: "Todos los orígenes" },
  { key: "campaignId", label: "Campaña", allLabel: "Todas las campañas" },
  { key: "assignedTo", label: "Responsable", allLabel: "Todos los responsables" },
];

const FilterSelect = ({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  // A value from the URL that the catalog no longer lists stays visible instead of
  // silently showing the first option while the filter still applies.
  const known = value === "" || options.some((option) => option.value === value);
  return (
    <div className="col-sm-6 col-xl-4">
      <label htmlFor={id} className={`form-label ${styles.filterLabel}`}>
        {label}
      </label>
      <select
        id={id}
        className={`form-select ${styles.filterControl}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {!known && <option value={value}>Valor no disponible</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

function formatRange(total: number, page: number) {
  if (total === 0) return "Sin resultados";
  const first = (page - 1) * LIST_PAGE_SIZE + 1;
  const last = Math.min(page * LIST_PAGE_SIZE, total);
  const noun = total === 1 ? "solicitud" : "solicitudes";
  if (first > total) return `${total} ${noun} en total`;
  return `Mostrando ${first}–${last} de ${total} ${noun}`;
}

const Pagination = ({ filters, totalPages }: { filters: ListFilters; totalPages: number }) => {
  if (totalPages <= 1) return null;
  const current = filters.page;
  const hrefFor = (page: number) => listPathFor(updateFilters(filters, { page }));

  return (
    <nav aria-label="Paginación de solicitudes" className="mt-20">
      <ul className={`pagination flex-wrap ${styles.pagination}`}>
        <li className={`page-item ${current <= 1 ? "disabled" : ""}`}>
          {current <= 1 ? (
            <span className="page-link" aria-disabled="true">
              Anterior
            </span>
          ) : (
            <Link className="page-link" href={hrefFor(current - 1)} aria-label="Página anterior">
              Anterior
            </Link>
          )}
        </li>
        {pageItems(current, totalPages).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} className="page-item disabled" aria-hidden="true">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={item} className={`page-item ${item === current ? "active" : ""}`}>
              <Link
                className="page-link"
                href={hrefFor(item)}
                aria-label={`Página ${item} de ${totalPages}`}
                aria-current={item === current ? "page" : undefined}
              >
                {item}
              </Link>
            </li>
          )
        )}
        <li className={`page-item ${current >= totalPages ? "disabled" : ""}`}>
          {current >= totalPages ? (
            <span className="page-link" aria-disabled="true">
              Siguiente
            </span>
          ) : (
            <Link className="page-link" href={hrefFor(current + 1)} aria-label="Página siguiente">
              Siguiente
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

const ProspectListMain = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const filters = useMemo(() => readListFilters(new URLSearchParams(queryString)), [queryString]);
  const apiQuery = prospectsApiQuery(filters);

  const [list, setList] = useState<Loadable<ProspectList>>({ kind: "loading" });
  const [catalogs, setCatalogs] = useState<Loadable<CatalogOptions>>({ kind: "loading" });
  const [forbidden, setForbidden] = useState(false);
  const [listReloadKey, setListReloadKey] = useState(0);
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [searchText, setSearchTextState] = useState(filters.q ?? "");
  // Mirrors searchText for the URL sync effect, which must not depend on every keystroke.
  const searchTextRef = useRef(searchText);
  // Search terms sent to the URL that have not landed yet, oldest first.
  const pendingSearchRef = useRef<string[]>([]);

  const setSearchText = useCallback((text: string) => {
    searchTextRef.current = text;
    setSearchTextState(text);
  }, []);

  const navigate = useCallback(
    (next: ListFilters, mode: "push" | "replace" = "push") => {
      router[mode](listPathFor(next), { scroll: false });
    },
    [router]
  );

  const applyFilter = (patch: FilterPatch) => navigate(updateFilters(filters, patch));

  const navigateToSearch = useCallback(
    (term: string, mode: "push" | "replace") => {
      pendingSearchRef.current = [...pendingSearchRef.current, term];
      navigate(updateFilters(filters, { q: term }), mode);
    },
    [filters, navigate]
  );

  // Prospects.
  useEffect(() => {
    const controller = new AbortController();
    setList({ kind: "loading" });

    fetchAdminJson<ProspectList>(`/api/admisiones-admin/prospects?${apiQuery}`, {
      signal: controller.signal,
    }).then((result) => {
      if (result.kind === "aborted") return;
      if (result.kind === "unauthenticated") router.replace(ADMIN_LOGIN_PATH);
      else if (result.kind === "forbidden") setForbidden(true);
      else if (result.kind === "error") setList({ kind: "error", message: result.message });
      else setList({ kind: "ready", data: result.data });
    });

    return () => controller.abort();
  }, [apiQuery, listReloadKey, router]);

  // Catalogs for the filters.
  useEffect(() => {
    const controller = new AbortController();
    setCatalogs({ kind: "loading" });

    fetchAdminJson<AdmissionsAdminCatalogs>("/api/admisiones-admin/catalogs", {
      signal: controller.signal,
    }).then((result) => {
      if (result.kind === "aborted") return;
      if (result.kind === "unauthenticated") router.replace(ADMIN_LOGIN_PATH);
      else if (result.kind === "forbidden") setForbidden(true);
      else if (result.kind === "error") setCatalogs({ kind: "error", message: result.message });
      else setCatalogs({ kind: "ready", data: catalogOptions(result.data) });
    });

    return () => controller.abort();
  }, [catalogReloadKey, router]);

  // Back, forward, and links change the URL: the search box follows. A search this list sent
  // itself can land after the user typed more, and then the box keeps the newer typing.
  useEffect(() => {
    const next = syncSearchFromUrl({
      urlTerm: filters.q ?? "",
      inputText: searchTextRef.current,
      pending: pendingSearchRef.current,
    });
    pendingSearchRef.current = next.pending;
    if (next.inputText !== searchTextRef.current) setSearchText(next.inputText);
  }, [filters.q, setSearchText]);

  // Debounced search. Replace, so each keystroke does not add a history entry.
  useEffect(() => {
    const term = normalizeSearch(searchText);
    if (term === (filters.q ?? "")) return;
    const timer = setTimeout(() => navigateToSearch(term, "replace"), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText, filters.q, navigateToSearch]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = normalizeSearch(searchText);
    if (term !== (filters.q ?? "")) navigateToSearch(term, "push");
  };

  const clearFilters = () => {
    pendingSearchRef.current = [];
    setSearchText("");
    navigate({ page: 1, sort: filters.sort, dir: filters.dir });
  };

  if (forbidden) {
    return (
      <div className="bd-dashboard-inner">
        <NoAccessState />
      </div>
    );
  }

  const options = catalogs.kind === "ready" ? catalogs.data : null;
  const filtered = hasActiveFilters(filters);
  const totalPages = list.kind === "ready" ? pageCount(list.data.total, LIST_PAGE_SIZE) : 1;
  const sortAria = (field: ListFilters["sort"]) =>
    filters.sort === field ? (filters.dir === "asc" ? "ascending" : "descending") : undefined;

  const renderRows = () => {
    if (list.kind !== "ready") return null;
    return list.data.rows.map((row) => (
      <tr key={row.id}>
        <td className={styles.nowrap}>
          <time dateTime={row.createdAt}>{dateFormatter.format(new Date(row.createdAt))}</time>
        </td>
        <th scope="row" className={styles.rowHeader}>
          <Link href={`${ADMIN_HOME_PATH}/solicitudes/${row.id}`} className={styles.rowLink}>
            {row.studentName || "Sin nombre"}
          </Link>
        </th>
        <td>{row.guardian.name}</td>
        <td className="text-break">
          {row.guardian.phone && <span className="d-block">{row.guardian.phone}</span>}
          {row.guardian.email && <span className="d-block">{row.guardian.email}</span>}
          {!row.guardian.phone && !row.guardian.email && "Sin contacto"}
        </td>
        <td>
          {row.grade.name}
          {row.modality && <span className="d-block text-muted">{row.modality.name}</span>}
        </td>
        <td>
          <span className="bd-badge">{row.status.name}</span>
        </td>
        <td>{row.assignee?.name ?? "Sin asignar"}</td>
      </tr>
    ));
  };

  const renderListState = () => {
    if (list.kind === "loading") return <LoadingState label="Cargando solicitudes..." />;
    if (list.kind === "error") {
      return (
        <ErrorState message={list.message} onRetry={() => setListReloadKey((key) => key + 1)} />
      );
    }
    if (list.data.rows.length > 0) return null;
    if (list.data.total > 0) {
      return (
        <EmptyState>
          <p className="mb-10">Esta página ya no tiene solicitudes.</p>
          <Link href={listPathFor(updateFilters(filters, { page: 1 }))}>Ir a la primera página</Link>
        </EmptyState>
      );
    }
    return (
      <EmptyState>
        <p className={filtered ? "mb-15" : "mb-0"}>
          {filtered ? "No hay solicitudes con estos filtros." : "Todavía no hay solicitudes registradas."}
        </p>
        {filtered && (
          <button type="button" className="bd-btn btn-primary" onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </EmptyState>
    );
  };

  return (
    <div className="bd-dashboard-inner">
      <div className="bd-dashboard-title-inner">
        <h2 className="bd-dashboard-title h4">Solicitudes</h2>
      </div>

      <form
        role="search"
        aria-label="Filtrar solicitudes"
        className={`mt-20 ${styles.filters}`}
        onSubmit={handleSearchSubmit}
      >
        <div className="row g-3">
          <div className="col-xl-8">
            <label htmlFor="prospect-search" className={`form-label ${styles.filterLabel}`}>
              Buscar
            </label>
            <input
              id="prospect-search"
              type="search"
              className={`form-control ${styles.filterControl}`}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              maxLength={100}
              autoComplete="off"
              aria-describedby="prospect-search-hint"
            />
            <p id="prospect-search-hint" className={styles.filterHint}>
              Nombre del estudiante o del encargado, teléfono o correo.
            </p>
          </div>
          <div className="col-xl-4">
            <label htmlFor="prospect-sort" className={`form-label ${styles.filterLabel}`}>
              Ordenar por
            </label>
            <select
              id="prospect-sort"
              className={`form-select ${styles.filterControl}`}
              value={`${filters.sort}:${filters.dir}`}
              onChange={(event) => {
                const [sort, dir] = event.target.value.split(":") as [
                  ListFilters["sort"],
                  ListFilters["dir"],
                ];
                applyFilter({ sort, dir });
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {catalogs.kind === "error" ? (
            <div className="col-12">
              <ErrorState
                message="No se pudieron cargar los filtros."
                onRetry={() => setCatalogReloadKey((key) => key + 1)}
              />
            </div>
          ) : (
            FILTER_FIELDS.map(({ key, label, allLabel }) => (
              <FilterSelect
                key={key}
                id={`prospect-filter-${key}`}
                label={label}
                value={filters[key] ?? ""}
                options={[{ value: "", label: allLabel }, ...(options?.[key] ?? [])]}
                onChange={(value) => applyFilter({ [key]: value })}
                disabled={!options}
              />
            ))
          )}
        </div>

        {filtered && (
          <div className="mt-15">
            <button type="button" className="bd-btn btn-outline-primary" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        )}
      </form>

      {list.kind === "ready" && list.data.searchTruncated && (
        <p className={`mt-20 ${styles.notice}`} role="status">
          La búsqueda coincide con demasiados encargados y solo se muestran parte de los resultados.
          Escriba un término más específico.
        </p>
      )}

      <p className={`mt-20 mb-0 ${styles.summary}`} role="status" aria-live="polite">
        {list.kind === "ready" ? formatRange(list.data.total, filters.page) : ""}
      </p>

      {renderListState()}

      {list.kind === "ready" && list.data.rows.length > 0 && (
        <>
          <div className="bd-dashboard-table table-responsive mt-10">
            <table className="table table-bordered table-head-bg">
              <caption className="visually-hidden">
                Solicitudes de admisión, página {filters.page} de {totalPages}
              </caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort={sortAria("created_at")}>
                    Fecha
                  </th>
                  <th scope="col" aria-sort={sortAria("student_name")}>
                    Estudiante
                  </th>
                  <th scope="col">Encargado</th>
                  <th scope="col">Contacto</th>
                  <th scope="col">Grado y modalidad</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Responsable</th>
                </tr>
              </thead>
              <tbody>{renderRows()}</tbody>
            </table>
          </div>
          <Pagination filters={filters} totalPages={totalPages} />
        </>
      )}
    </div>
  );
};

export default ProspectListMain;
