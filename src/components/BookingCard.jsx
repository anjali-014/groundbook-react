import { stateName } from '../data/complex.js';
import { hhmm, longDate } from '../data/days.js';
import { useEventNames, useGet } from '../hooks/useApi.jsx';

/**  One booking (GET /bookings/{id}): the slot, the ground held around it and its state. */
export default function BookingCard({ id }) {
  const answer = useGet(`/bookings/${id}`);
  const names = useEventNames();
    if (answer?.status !== 200 || !names) return null;
  const b = answer.body;
  const date = b.from.slice(0, 10);

    return (
    <article className="card booking-card">
      <header className="booking-head">
        <div>
            <p className="eyebrow">{longDate(date)} · Ground {b.ground}</p>
          <h2 className="booking-id mono">{b.bookingId}</h2>
             </div>
                     <span className={`state-pill is-${b.state}`}>{stateName(b.state)}</span>
      </header>
            <dl className="facts">
        <div><dt>Event</dt><dd>{names[b.event]}</dd></div>
       <div><dt>Slot</dt><dd className="mono">{hhmm(b.from)}–{hhmm(b.to)}</dd></div>
        <div><dt>Ground held</dt><dd className="mono">{hhmm(b.groundHeldFrom)}–{hhmm(b.groundHeldTo)}</dd></div>
        </dl>
        </article>
  );
}
