// PROVIDED: do not edit.
// The "database" for this session only: plain arrays, one per MERN collection, filled from seed.js when the page
// loads. Nothing is saved anywhere: a refresh starts again with the four grounds and no booking.
import { SEED } from './seed.js';

export const venues = SEED.venues.map((v) => ({ ...v }));
export const grounds = SEED.grounds.map((g) => ({ ...g }));
export const eventTypes = SEED.eventTypes.map((t) => ({ ...t }));

/** { bookingId, venueId, groundId, eventTypeId, clubName, fromAt, toAt, state, requestedAt, holdUntil, ... } */
export const bookings = [];

/** The record of every change to a booking: { venueId, bookingId, kind, at, actorId, data }. Only ever added to. */
export const events = [];
