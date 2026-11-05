import { normalizeSearch } from "@/lib/admissions/admin-list-params";

export type SearchSyncInput = {
  /** The search term the URL holds now. */
  urlTerm: string;
  /** What the search box shows. */
  inputText: string;
  /** Terms this list sent to the URL that have not landed yet, oldest first. */
  pending: string[];
};

/**
 * Decides what the search box shows after the URL search term changes.
 *
 * A debounced search lands in the URL some time after it was sent, and the user may have kept
 * typing meanwhile. When the term that landed is one this list sent, the box keeps what the
 * user typed. Any other change came from outside (back, forward, Limpiar filtros, a dashboard
 * link), so the box follows the URL and the pending terms are dropped. The router can skip a
 * superseded navigation, so a term that lands also settles every term sent before it.
 */
export function syncSearchFromUrl({ urlTerm, inputText, pending }: SearchSyncInput): {
  inputText: string;
  pending: string[];
} {
  const index = pending.indexOf(urlTerm);
  if (index !== -1) return { inputText, pending: pending.slice(index + 1) };
  if (normalizeSearch(inputText) === urlTerm) return { inputText, pending: [] };
  return { inputText: urlTerm, pending: [] };
}
