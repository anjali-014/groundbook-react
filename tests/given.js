// Puts the planner into a state before a screen opens, and sets the clock, the way the ticket's "Given" says.
// Everything goes through the api the screens use; nothing here looks inside the app.
//
// The complex's clock is India time written with a Z: at 13:43 in India the planner's "now" reads 13:43Z, a slot at
// 14:00 is sent as 14:00Z and shown as 14:00, and the grounds' hours are read on that same clock. So a moment at the
// complex is written here as India time (+05:30), and the screens show it as it is written.
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

/** A moment at the complex: india('2026-11-03', '13:43') is 13:43 on Tuesday 3 November in India. */
export const india = (date, hhmm) => new Date(`${date}T${hhmm}:00+05:30`);

/** Tuesday 3 November 2026, 13:43 at the complex: next Saturday is 7 November; a hold made now lasts until Wed 4 Nov, 13:43. */
export const TUE_1343 = india('2026-11-03', '13:43');

/** Next Saturday, seen from TUE_1343. */
export const SAT = '2026-11-07';

/** Puts the clock at this moment; it keeps running on from there. */
export function clockAt(when) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(when);
}

/**
 * Lets this much time pass on the clock, timers included, in small steps: between steps the screen gets to draw,
 * so a timer that a new screen starts also runs within the time.
 */
export async function wait(ms) {
  for (let left = ms; left > 0; left -= 100) await vi.advanceTimersByTimeAsync(Math.min(100, left));
}

/** Moves the clock to another moment (a slot that has begun, one that has ended), firing nothing. */
export function moveClockTo(when) {
  vi.setSystemTime(when);
}

/** A person at the keyboard and mouse; works with the clock set or not. */
export function person() {
  return userEvent.setup({ advanceTimers: (ms) => (vi.isFakeTimers() ? vi.advanceTimersByTime(ms) : undefined) });
}

/** The event types as the backend names them. */
export const EVENT = {
  'Practice': 'practice',
  'Friendly match': 'friendly',
  'League match': 'league',
  'Athletics meet': 'athletics',
  'Tournament': 'tournament',
  'School sports day': 'school_day',
};

/** A slot time at the complex as the api writes it: 14:00 on 2026-11-07 is 2026-11-07T14:00:00Z. */
const at = (date, hhmm) => `${date}T${hhmm}:00Z`;

/** A club's request through the api: book(api, 'A', 'League match', '14:00', '17:00') on next Saturday. */
export async function book(api, ground, event, from, to, { date = SAT, club = 'Deccan Gymkhana' } = {}) {
  const { status, body } = await api.post('/bookings', { ground, event: EVENT[event], from: at(date, from), to: at(date, to), club });
  if (status !== 201) throw new Error(`the request was refused: ${JSON.stringify(body)}`);
  return body;
}

export async function confirm(api, id) {
  const { status, body } = await api.post(`/bookings/${id}/confirm`);
  if (status !== 200) throw new Error(`the confirm was refused: ${JSON.stringify(body)}`);
  return body;
}

export async function cancel(api, id) {
  const { status, body } = await api.post(`/bookings/${id}/cancel`);
  if (status !== 200) throw new Error(`the cancel was refused: ${JSON.stringify(body)}`);
  return body;
}

export async function move(api, id, from, to, { date = SAT } = {}) {
  const { status, body } = await api.post(`/bookings/${id}/move`, { from: at(date, from), to: at(date, to) });
  if (status !== 200) throw new Error(`the move was refused: ${JSON.stringify(body)}`);
  return body;
}

/** One booking as the api reads it, with its record. */
export async function read(api, id) {
  return (await api.get(`/bookings/${id}`)).body;
}
