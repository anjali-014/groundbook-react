// PROVIDED: do not edit.
// A club's booking: requested, read with its record, confirmed, cancelled. A booking's shadow (the ground held for
// the setup before it and the teardown after it) is never stored: it is worked out from its event type on every read.
import * as store from '../store.js';
import { iso, now, wholeSecond } from '../clock.js';
import {
  AlreadyCancelled, AlreadyConfirmed, AlreadyOver, AlreadyStarted, BadInterval, Cancelled, NoSuchBooking, NoSuchEventType,
  NoSuchGround, Overlap, ValidationError,
} from '../errors.js';
import { hoursOn } from '../grounds/hours.js';

const VENUE = 'deccan';
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
/** How long a requested booking holds its slot (the MERN backend's HOLD_HOURS default). */
const HOLD_HOURS = 24;
/** Nobody logs in: every change is made by the office. */
const OFFICE = 'office';

const typeOf = (code) => store.eventTypes.find((t) => t.venueId === VENUE && t.code === code);

/** Writes the event of a change to a booking: ids and facts, never the club. */
export function record(bookingId, kind, at, data = {}) {
  store.events.push({ venueId: VENUE, bookingId, kind, at, actorId: OFFICE, data });
}

/** A record line: when, what, and the event's facts (times as ISO strings). */
function line(event) {
  const facts = Object.entries(event.data).map(([k, v]) => [k, v instanceof Date ? iso(v) : v]);
  return { at: iso(event.at), kind: event.kind, ...Object.fromEntries(facts) };
}

/** The ground is held from the setup before the event to the teardown after it. */
export function shadowOf(fromAt, toAt, type) {
  return {
    heldFrom: new Date(fromAt.getTime() - type.setupMinutes * MINUTE),
    heldTo: new Date(toAt.getTime() + type.teardownMinutes * MINUTE),
  };
}

/** A booking as the API shows it, with its shadow; the club's name stays inside. */
export function shape(b) {
  const { heldFrom, heldTo } = shadowOf(b.fromAt, b.toAt, typeOf(b.eventTypeId));
  return {
    bookingId: b.bookingId, ground: b.groundId, event: b.eventTypeId, from: iso(b.fromAt), to: iso(b.toAt),
    groundHeldFrom: iso(heldFrom), groundHeldTo: iso(heldTo), state: b.state,
  };
}

/**
 * Refuses a booking whose shadow clashes with a live booking's on the same ground and date (leaving itself out),
 * naming each clashing booking and the range it holds. Live: confirmed, or requested and still inside its hold.
 * Two shadows clash when each starts before the other ends, so touching shadows do not clash.
 */
export function refuseClashes({ bookingId, groundId, fromAt, toAt, type }, at) {
  const mine = shadowOf(fromAt, toAt, type);
  const start = new Date(`${iso(fromAt).slice(0, 10)}T00:00:00Z`).getTime();
  const clashing = store.bookings
    .filter((o) => o.venueId === VENUE && o.groundId === groundId && o.bookingId !== bookingId)
    .filter((o) => o.fromAt >= start && o.fromAt < start + DAY)
    .filter((o) => o.state === 'confirmed' || (o.state === 'requested' && o.holdUntil >= at))
    .map((o) => ({ o, held: shadowOf(o.fromAt, o.toAt, typeOf(o.eventTypeId)) }))
    .filter(({ held }) => mine.heldFrom < held.heldTo && held.heldFrom < mine.heldTo);
  if (clashing.length) {
    throw Overlap(clashing.map(({ o, held }) => ({
      bookingId: o.bookingId, groundHeldFrom: iso(held.heldFrom), groundHeldTo: iso(held.heldTo),
    })));
  }
}

/**
 * The rules of an interval, after the body is valid: to after from, 30 minutes to 12 hours, not in the past, one
 * date, and the shadow inside the ground's hours that weekday.
 */
export function checkInterval({ ground, type, at }, fromAt, toAt) {
  if (toAt <= fromAt) throw BadInterval('The interval must end after it starts');
  const minutes = (toAt - fromAt) / MINUTE;
  if (minutes < 30 || minutes > 12 * 60) {
    throw ValidationError([{ field: 'to', message: 'An interval lasts from 30 minutes to 12 hours' }]);
  }
  if (fromAt < at) throw BadInterval('Nobody books the past');
  const date = iso(fromAt).slice(0, 10);
  if (iso(toAt).slice(0, 10) !== date) throw BadInterval('The interval must start and end on the same date');
  const hours = hoursOn(ground, date);
  const { heldFrom, heldTo } = shadowOf(fromAt, toAt, type);
  if (heldFrom < new Date(`${date}T${hours.opens}:00Z`) || heldTo > new Date(`${date}T${hours.closes}:00Z`)) {
    throw BadInterval(`With setup and teardown, the ground is held outside its hours, ${hours.opens}-${hours.closes}`, hours);
  }
}

export function requireBooking(id) {
  const found = store.bookings.find((b) => b.venueId === VENUE && b.bookingId === id);
  if (!found) throw NoSuchBooking(id);
  return found;
}

/**
 * A club asks for a slot: a requested booking, held for HOLD_HOURS from now, unless its shadow clashes. The booking
 * gets its requested event.
 */
export function request({ ground: code, event, from, to, club }) {
  const ground = store.grounds.find((g) => g.venueId === VENUE && g.code === code);
  if (!ground) throw NoSuchGround(code);
  const type = typeOf(event);
  if (!type) throw NoSuchEventType(event);
  const fromAt = wholeSecond(new Date(from));
  const toAt = wholeSecond(new Date(to));
  const requestedAt = wholeSecond(now());
  checkInterval({ ground, type, at: requestedAt }, fromAt, toAt);
  refuseClashes({ bookingId: null, groundId: code, fromAt, toAt, type }, requestedAt);
  const holdUntil = new Date(requestedAt.getTime() + HOLD_HOURS * 60 * MINUTE);
  const booking = {
    bookingId: `BK${String(store.bookings.length + 1).padStart(4, '0')}`, venueId: VENUE, groundId: code, eventTypeId: event,
    clubName: club, fromAt, toAt, state: 'requested', requestedAt, holdUntil, movedAt: null, previousFrom: null,
    previousTo: null, confirmedAt: null, cancelledAt: null, lateCancel: false,
  };
  store.bookings.push(booking);
  record(booking.bookingId, 'requested', requestedAt, { from: fromAt, to: toAt });
  return { ...shape(booking), holdUntil: iso(holdUntil) };
}

/** A booking with its shadow and its whole record, in `at` order (same-time events in the order they were written). */
export function booking(id) {
  const found = requireBooking(id);
  const history = store.events.filter((e) => e.venueId === VENUE && e.bookingId === id)
    .map((e, i) => ({ e, i }))
    .sort((x, y) => x.e.at - y.e.at || x.i - y.i)
    .map(({ e }) => line(e));
  return { ...shape(found), events: history };
}

/**
 * A requested booking is confirmed: only before its interval begins, and only if its shadow still clashes with
 * nothing live (a competing request may have been confirmed since).
 */
export function confirm(id) {
  const b = requireBooking(id);
  if (b.state === 'cancelled') throw Cancelled();
  if (b.state === 'confirmed') throw AlreadyConfirmed();
  const confirmedAt = wholeSecond(now());
  if (confirmedAt >= b.fromAt) throw AlreadyStarted();
  refuseClashes({ bookingId: id, groundId: b.groundId, fromAt: b.fromAt, toAt: b.toAt, type: typeOf(b.eventTypeId) }, confirmedAt);
  b.state = 'confirmed';
  b.confirmedAt = confirmedAt;
  record(id, 'confirmed', confirmedAt);
  return { bookingId: id, state: 'confirmed', confirmedAt: iso(confirmedAt) };
}

/**
 * A requested or confirmed booking is cancelled: only before its interval ends. Once it has begun the cancel is late:
 * allowed and flagged.
 */
export function cancel(id) {
  const b = requireBooking(id);
  if (b.state === 'cancelled') throw AlreadyCancelled();
  const cancelledAt = wholeSecond(now());
  if (cancelledAt >= b.toAt) throw AlreadyOver();
  const late = cancelledAt >= b.fromAt;
  b.state = 'cancelled';
  b.cancelledAt = cancelledAt;
  b.lateCancel = late;
  record(id, 'cancelled', cancelledAt, { late });
  return { bookingId: id, state: 'cancelled', cancelledAt: iso(cancelledAt), late };
}
