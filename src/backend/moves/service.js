// PROVIDED: do not edit.
// Moving a booking to a new interval on its ground.
import * as store from '../store.js';
import { iso, now, wholeSecond } from '../clock.js';
import { AlreadyStarted, Cancelled } from '../errors.js';
import { checkInterval, record, refuseClashes, requireBooking, shadowOf } from '../bookings/service.js';

/**
 * A booking moves to a new interval: the same checks as a request, the clash check leaving the booking itself out.
 * Every check comes before the change, so a refused move leaves the booking exactly where it was. The state is kept.
 */
export function move(id, { from, to }) {
  const b = requireBooking(id);
  if (b.state === 'cancelled') throw Cancelled();
  const movedAt = wholeSecond(now());
  if (movedAt >= b.fromAt) throw AlreadyStarted();
  const ground = store.grounds.find((g) => g.venueId === b.venueId && g.code === b.groundId);
  const type = store.eventTypes.find((t) => t.venueId === b.venueId && t.code === b.eventTypeId);
  const fromAt = wholeSecond(new Date(from));
  const toAt = wholeSecond(new Date(to));
  checkInterval({ ground, type, at: movedAt }, fromAt, toAt);
  refuseClashes({ bookingId: id, groundId: b.groundId, fromAt, toAt, type }, movedAt);
  record(id, 'moved', movedAt, { from: fromAt, to: toAt, previousFrom: b.fromAt, previousTo: b.toAt });
  Object.assign(b, { fromAt, toAt, movedAt, previousFrom: b.fromAt, previousTo: b.toAt });
  const { heldFrom, heldTo } = shadowOf(fromAt, toAt, type);
  return {
    bookingId: id, from: iso(fromAt), to: iso(toAt), groundHeldFrom: iso(heldFrom), groundHeldTo: iso(heldTo),
    movedAt: iso(movedAt),
  };
}
