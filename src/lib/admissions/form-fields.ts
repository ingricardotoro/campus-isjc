// Anti-spam fields shared by the public form and the API route. They are not
// part of the validated schema: the route inspects them before validation.

/** Hidden field that people never fill; bots that fill every input do. */
export const HONEYPOT_FIELD = "website";

/** Epoch milliseconds when the form was rendered in the browser. */
export const STARTED_AT_FIELD = "startedAt";

/** Submissions faster than this are treated as automated. */
export const MIN_FILL_TIME_MS = 3000;

/** How far ahead of the server a device clock may run before it counts as forged. */
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/** Request bodies above this size are rejected before parsing. */
export const MAX_BODY_BYTES = 10 * 1024;
