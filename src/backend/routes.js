// PROVIDED: do not edit.
// The backend's door: a method and a path (and a body) find their endpoint, the request is checked as the MERN
// routers check it, the service runs, and the answer comes back as { status, body }. A refusal comes back as the one
// problem body; a path nobody serves is a 404 problem.
import { Refusal, ValidationError } from './errors.js';
import * as groundService from './grounds/service.js';
import * as bookingService from './bookings/service.js';
import * as moveService from './moves/service.js';

// ── checking a request (the MERN routers do this with zod; these give the same messages) ──
const DATETIME = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;
const isCalendarDay = (d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d);

function textProblem(value) {
  if (value === undefined) return 'Required';
  if (typeof value !== 'string') return `Expected string, received ${value === null ? 'null' : typeof value}`;
  if (value.length < 1) return 'String must contain at least 1 character(s)';
  return null;
}

function instantProblem(value) {
  const problem = textProblem(value);
  if (problem && problem !== 'String must contain at least 1 character(s)') return problem;
  return DATETIME.test(value) && isCalendarDay(value.slice(0, 10)) ? null : 'Invalid datetime';
}

/** The body has these fields, each passing its check; otherwise a 400 naming every bad one, in this order. */
function checkBody(body, checks) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw ValidationError([{ field: '', message: `Expected object, received ${body === null ? 'null' : typeof body}` }]);
  }
  const errors = Object.entries(checks)
    .map(([field, check]) => ({ field, message: check(body[field]) }))
    .filter((e) => e.message);
  if (errors.length) throw ValidationError(errors);
  return body;
}

/** ?date= is optional; when given it is a real calendar day written YYYY-MM-DD. */
function checkDay(date) {
  if (date === undefined) return undefined;
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push({ field: 'date', message: 'must be YYYY-MM-DD' });
  if (!isCalendarDay(date)) errors.push({ field: 'date', message: 'must be a real calendar day' });
  if (errors.length) throw ValidationError(errors);
  return date;
}

const requestBody = { ground: textProblem, event: textProblem, from: instantProblem, to: instantProblem, club: textProblem };
const moveBody = { from: instantProblem, to: instantProblem };

// ── the endpoints the screens call ──
const ROUTES = [
  ['GET', '/venues/:venue/grounds', (p) => groundService.grounds(p.venue)],
  ['GET', '/venues/:venue/event-types', (p) => groundService.eventTypes(p.venue)],
  ['GET', '/venues/:venue/grounds/:ground/day', (p, q) => groundService.day(p.venue, p.ground, checkDay(q.date))],
  ['POST', '/bookings', (p, q, body) => bookingService.request(checkBody(body, requestBody)), 201],
  ['GET', '/bookings/:bookingId', (p) => bookingService.booking(p.bookingId)],
  ['POST', '/bookings/:bookingId/confirm', (p) => bookingService.confirm(p.bookingId)],
  ['POST', '/bookings/:bookingId/cancel', (p) => bookingService.cancel(p.bookingId)],
  ['POST', '/bookings/:bookingId/move', (p, q, body) => moveService.move(p.bookingId, checkBody(body, moveBody))],
];

/** '/bookings/:bookingId' against '/bookings/BK0001' → { bookingId: 'BK0001' }, or null when it does not fit. */
function matchPath(pattern, path) {
  const want = pattern.split('/');
  const got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i += 1) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = decodeURIComponent(got[i]);
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

function problem(path, { status, type, title, message, extras }) {
  return { status, body: { type, title, status, detail: message, instance: path, ...extras } };
}

/** One request: { status, body }. */
export function handle(method, url, body) {
  const [path, queryText = ''] = url.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryText));
  for (const [routeMethod, pattern, run, status = 200] of ROUTES) {
    const params = routeMethod === method ? matchPath(pattern, path) : null;
    if (!params) continue;
    try {
      return { status, body: run(params, query, body) };
    } catch (error) {
      if (error instanceof Refusal) return problem(path, error);
      throw error;
    }
  }
  return problem(path, { status: 404, type: 'about:blank', title: 'Not Found', message: `Nothing is served at ${path}`, extras: {} });
}
