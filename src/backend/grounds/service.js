// PROVIDED: do not edit.
// The venue's grounds, its event types, and one ground's day.
import * as store from '../store.js';
import { now } from '../clock.js';
import { NoSuchGround, NoSuchVenue } from '../errors.js';
import { shape } from '../bookings/service.js';
import { hoursOn } from './hours.js';

const DAY = 24 * 60 * 60 * 1000;

function requireVenue(venue) {
  if (!store.venues.some((v) => v.slug === venue)) throw NoSuchVenue(venue);
}

/** The venue's grounds, A to D, each with its weekday and Sunday hours. */
export function grounds(venue) {
  requireVenue(venue);
  const list = store.grounds.filter((g) => g.venueId === venue).sort((a, b) => a.code.localeCompare(b.code));
  return {
    venue,
    grounds: list.map((g) => ({
      ground: g.code, name: g.name, opens: g.opens, closes: g.closes, sundayOpens: g.sundayOpens, sundayCloses: g.sundayCloses,
    })),
  };
}

/** The event types with their setup and teardown buffers. */
export function eventTypes(venue) {
  requireVenue(venue);
  return {
    eventTypes: store.eventTypes.filter((t) => t.venueId === venue).map((t) => ({
      code: t.code, name: t.name, setupMinutes: t.setupMinutes, teardownMinutes: t.teardownMinutes,
    })),
  };
}

/**
 * One ground's day: its hours on that weekday, and its bookings in `from` order, each with the shadow its event type
 * gives it. No date means today by the clock, in UTC.
 */
export function day(venue, code, date) {
  requireVenue(venue);
  const g = store.grounds.find((x) => x.venueId === venue && x.code === code);
  if (!g) throw NoSuchGround(code);
  const on = date || now().toISOString().slice(0, 10);
  const start = new Date(`${on}T00:00:00Z`).getTime();
  const list = store.bookings
    .filter((b) => b.venueId === venue && b.groundId === code && b.fromAt >= start && b.fromAt < start + DAY)
    .sort((a, b) => a.fromAt - b.fromAt)
    .map((b) => {
      const { bookingId, event, from, to, groundHeldFrom, groundHeldTo, state } = shape(b);
      return { bookingId, event, from, to, groundHeldFrom, groundHeldTo, state };
    });
  return { venue, ground: code, date: on, ...hoursOn(g, on), bookings: list };
}
