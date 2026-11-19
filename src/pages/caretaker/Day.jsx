import { useEffect, useRef, useState } from 'react';
import BookingCard from '../../components/BookingCard.jsx';
import DateStepper, { useDate } from '../../components/DateStepper.jsx';
import DayStrip from '../../components/DayStrip.jsx';
import Icon from '../../components/Icon.jsx';
import Problem from '../../components/Problem.jsx';
import { STATES, VENUE } from '../../data/complex.js';
import { useGet } from '../../hooks/useApi.jsx';

/** One ground's strip for the day: GET /venues/deccan/grounds/{ground}/day?date=. */
export function GroundDay({ ground, date, onPick, selected, ghost }) {
  const answer = useGet(`/venues/${VENUE.slug}/grounds/${ground}/day?date=${date}`);
  if (!answer) return null;
  if (answer.status !== 200) return <Problem answer={answer} compact />;
  return <DayStrip day={answer.body} onPick={onPick} selected={selected} ghost={ghost} />;
}

/**
 * Sabu's day: the four grounds as strips from opening to closing (07:00–20:00 on a Sunday), each booking a block
 * with the ground held around it; the event types with their buffers (GET …/event-types) as chips above them.
 */
export default function Day() {
  const [date, setDate] = useDate();
  const [selected, setSelected] = useState(null);
  const opener = useRef(null);
  const closeButton = useRef(null);
  const grounds = useGet(`/venues/${VENUE.slug}/grounds`);
  const types = useGet(`/venues/${VENUE.slug}/event-types`);

  /** A block opens its booking in the panel; the block is remembered so the focus can go back to it. */
  function open(id) {
    opener.current = document.activeElement;
    setSelected(id);
  }

  // While the panel is open the focus starts on its ✕ and Esc closes it, as ✕ and a click outside do; when it closes
  // the focus goes back to the block that opened it.
  useEffect(() => {
    if (!selected) return undefined;
    closeButton.current?.focus();
    function onKey(e) {
      if (e.key === 'Escape') setSelected(null);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, [selected]);
  return (
    <div className="page is-fit">
      <div className="page-head">
        <div>
          <p className="eyebrow">{VENUE.name} · the planner</p>
          <h1 className="page-title">The day</h1>
        </div>
        <DateStepper date={date} onChange={(d) => { setDate(d); setSelected(null); }} />
      </div>


      <div className="types" role="group" aria-label="Event types and their buffers">
        {types && (types.status !== 200 ? <Problem answer={types} compact /> : types.body.eventTypes.map((t) => (
          <span key={t.code} className="type-chip">
            <span>{t.name}</span> <span className="mono">{t.setupMinutes} before · {t.teardownMinutes} after</span></span>
        )))}
      </div>
      <div className="planner">
        {grounds && (grounds.status !== 200 ? <Problem answer={grounds} compact />
          : grounds.body.grounds.map((g) => <GroundDay key={g.ground} ground={g.ground} date={date} onPick={open} selected={selected} />))}
      </div>

      <ul className="legend legend-below legend-wrap" aria-label="Legend">
        {STATES.map((s) => <li key={s.id}><span className={`dot is-${s.id}`} /> {s.name}</li>)}
        <li className="muted">The lighter edge either side: the ground held for setup and teardown</li>
      </ul>

      {selected && (
        <div className="drawer-scrim" onClick={() => setSelected(null)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Booking ${selected}`} onClick={(e) => e.stopPropagation()}>
            <header className="drawer-head">
              <div><p className="eyebrow">Booking</p><h2 className="drawer-title">{selected}</h2></div>
              <button type="button" className="icon-btn" ref={closeButton} onClick={() => setSelected(null)} aria-label="Close"><Icon name="x" /></button>
            </header>
            <BookingCard key={selected} id={selected} actions />
          </aside>

        </div>
      )}
    </div>
  );
}
