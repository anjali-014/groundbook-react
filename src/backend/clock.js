// PROVIDED: do not edit.
// The one place the backend's time comes from, and how it writes an instant.
// Every time in the planner is the complex's own clock, India time (UTC+05:30), written with a Z: a slot at 14:00,
// the grounds' hours (06:00–22:00) and now are all read on that one clock, so "already begun" and "the past" are
// measured at the complex.

const INDIA = (5 * 60 + 30) * 60000;   // India keeps one offset all year

/** Now, on the complex's clock (India time). */
export function now() {
  return new Date(Date.now() + INDIA);
}

/** The same instant without its milliseconds: every time the app stores and answers is to the whole second. */
export function wholeSecond(date) {
  return new Date(Math.floor(date.getTime() / 1000) * 1000);
}

/** An instant as the API writes it: ISO 8601 in UTC, to the whole second, ending in Z. */
export function iso(date) {
  return wholeSecond(date).toISOString().replace('.000Z', 'Z');
}
