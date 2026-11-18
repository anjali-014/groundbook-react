// Days and times on the planner, all in India time. The backend writes every time on the complex's own clock (India 
// time) ending in Z: a slot typed as 14:00 is sent as 14:00Z and shown as 14:00, and the moments things happen (the
// end of a hold) are shown as written too. Only the computer's own clock (Date.now(), real UTC) needs turning into
// India time, to know today's date at the centre.
/** The date (YYYY-MM-DD) of a time the API wrote. */
export const dayOf = (iso) => (iso ? iso.slice(0, 10) : '');
// (Date.now(), real UTC) needs turning into India time, to know today's date at the complex.
// real UTC) needs turning into India time, to know today's date at the complex.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** The calendar date (YYYY-MM-DD) of an instant. */
const dateOf = (ms) => new Date(ms).toISOString().slice(0, 10);

/** A date n days on. */
export const addDays = (date, n) => dateOf(Date.parse(`${date}T00:00:00Z`) + n * 86400000);

/** India keeps one offset all year: UTC+05:30. */
const INDIA = (5 * 60 + 30) * 60000;

/** The next Saturday after the computer's real time (ms), counted from today's date in India (the day clubs play). */
export function nextSaturday(ms) {
  const today = dateOf(ms + INDIA);
    const day = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, ((6 - day + 7) % 7) || 7);
}

/** The day of the week of a date, e.g. "Saturday". */
export const weekday = (date) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
/** "Saturday 3 October" */
export function longDate(date) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })}`;
}

/**  A slot's time typed at the complex, as the API writes it: 14:00 on 2026-10-03 is 2026-10-03T14:00:00Z. */
export const instant = (date, hhmm) => `${date}T${hhmm}:00Z`;
/** HH:MM of a slot time the API wrote (the complex's clock, so it is shown as written). */
export const hhmm = (iso) => (iso ? iso.slice(11, 16) : '');

/** Minutes since midnight of HH:MM. */
export const minutesOf = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));


/** Click anywhere in a date box: its calendar opens (where the browser can show it on request). */
export function openPicker(e) {
  try { e.currentTarget.showPicker?.(); } catch { /* not allowed here: the box still takes typing */ }
}