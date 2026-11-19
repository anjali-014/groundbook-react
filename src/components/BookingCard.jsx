import { useState } from 'react';
import Icon from './Icon.jsx';
import Problem from './Problem.jsx';
import { stateName } from '../data/complex.js';
import { hhmm, longDate } from '../data/days.js';
import { explain } from '../data/messages.js';
import { useEventNames, useGet, usePost } from '../hooks/useApi.jsx';

/** What an action answered, in the clerk's words. */
function Outcome({ answer, ok }) {
  if (!answer) return null;
  if (answer.status < 300) return <div className="result-pill is-ok"><Icon name="check" size={16} strokeWidth={2.4} /><span>{ok(answer.body)}</span></div>;
  const { title, text } = explain(answer);
  return <div className="result-pill is-no"><Icon name="alert" size={16} /><div><strong>{title}</strong><p>{text}</p></div></div>;
}

/**
 * One booking (GET /bookings/{id}): the slot, the hall held around it and its state. Divya can Confirm and Cancel
 * it from here.
 */
export default function BookingCard({ id }) {
  const post = usePost();
  const answer = useGet(`/bookings/${id}`);
  const names = useEventNames();
  const [result, setResult] = useState(null);

  // Handle case where booking is not found (404) or answer fails to load
  if (!answer || answer.status === 404) {
    return (
      <div className="card">
        <h2>No such booking</h2>
        <p>There is no booking {id}.</p>
      </div>
    );
  }

  if (answer.status !== 200) return <div className="card"><Problem answer={answer} /></div>;
  
  const b = answer.body;
  const date = b.from.slice(0, 10);
  
  async function act(kind) {
    setResult({ kind, ...(await post(`/bookings/${id}/${kind}`)) });
  }

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

      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={() => act('confirm')}><Icon name="check" size={16} /> Confirm</button>
        <button type="button" className="btn btn-soft" onClick={() => act('cancel')}><Icon name="x" size={16} /> Cancel</button>
      </div>
      <Outcome answer={result} ok={(r) => (result.kind === 'confirm' ? `Confirmed at ${hhmm(r.confirmedAt)}.`
        : `Cancelled${r.late ? ' late: the slot had already begun' : ''}.`)} />
      
    </article>
  );
}
