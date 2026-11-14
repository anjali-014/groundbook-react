// PROVIDED: do not edit.
// Every refusal the backend gives, with the MERN backend's status, type, title and detail. The services throw them;
// routes.js turns each into the one problem body: { type, title, status, detail, instance, ...extras }.

export class Refusal extends Error {
  constructor(status, type, title, detail, extras = {}) {
    super(detail);
    this.status = status;
    this.type = type;
    this.title = title;
    this.extras = extras;
  }
}

/** A bad request: `errors` is [{ field, message }], one for each field that is not right. */
export const ValidationError = (errors) =>
  new Refusal(400, '/errors/validation', 'Invalid request', 'The request is not valid', { errors });

export const NoSuchVenue = (venue) => new Refusal(404, '/errors/no-such-venue', 'No such venue', `There is no venue ${venue}`);

export const NoSuchGround = (ground) => new Refusal(404, '/errors/no-such-ground', 'No such ground', `This venue has no ground ${ground}`);

export const NoSuchEventType = (code) => new Refusal(400, '/errors/no-such-event-type', 'No such event type', `There is no event type ${code}`);

export const NoSuchBooking = (id) => new Refusal(404, '/errors/no-such-booking', 'No such booking', `There is no booking ${id}`);

/** A valid body asking for an impossible interval. When it is about the ground's hours, it says them. */
export const BadInterval = (detail, hours = null) =>
  new Refusal(400, '/errors/bad-interval', 'Bad interval', detail, hours ? { opens: hours.opens, closes: hours.closes } : {});

export const AlreadyStarted = () =>
  new Refusal(409, '/errors/already-started', 'Already started', 'The interval has begun; it can no longer be confirmed or moved');

export const Cancelled = () =>
  new Refusal(409, '/errors/cancelled', 'Cancelled', 'A cancelled booking cannot be confirmed or moved; request a new one');

export const AlreadyConfirmed = () => new Refusal(409, '/errors/already-confirmed', 'Already confirmed', 'The booking is already confirmed');

export const AlreadyOver = () =>
  new Refusal(409, '/errors/already-over', 'Already over', 'The interval has ended; it can no longer be cancelled');

export const AlreadyCancelled = () => new Refusal(409, '/errors/already-cancelled', 'Already cancelled', 'The booking is already cancelled');

/** The shadow clashes with live bookings on the ground: each one named with the range it holds. */
export const Overlap = (clashesWith) =>
  new Refusal(409, '/errors/overlap', 'Overlap', 'With setup and teardown counted, the ground is already held then', { clashesWith });
