import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { dayOf, hhmm, longDate, minutesOf, weekday } from '../../data/days.js';

/**
 * After a request: the clerk pencils the booking onto the ground's day, and the ground is held around it.
 *   'pencil'  the booking waits below the ground's day; drag it onto its slot (or tap it)
 *   'holding' it sits in its slot; the setup before and the teardown after spread out around it
 *   'done'    done; OK clears the card for the next request
 * The hold was made by the request itself (the answer's groundHeldFrom/To); this only shows where it falls.
 * `ground` is the booking's ground as GET …/grounds gives it, with its weekday and Sunday hours; `eventName` is its
 * event type's name. The end of the hold is a real instant, shown in India time.
 * Drag and drop is HTML's own; tapping the booking does the same, because phones do not drag.
 */
export default function PencilIn({ booking, ground, eventName, club, onDone, onOpen }) {
  const [stage, setStage] = useState('pencil');
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);

  function pencilIn() {
    if (stage !== 'pencil') return;
    setOver(false);
    setDragging(false);
    setStage('holding');
  }

    // The hold spreads out by itself once the booking is on the day.
  useEffect(() => {
    if (stage !== 'holding') return undefined;
    const timer = setTimeout(() => setStage('done'), 1000);
        return () => clearTimeout(timer);
  }, [stage]);

    const { bookingId: id, groundHeldFrom: heldFrom, groundHeldTo: heldTo, holdUntil } = booking;
  const sunday = weekday(booking.from.slice(0, 10)) === 'Sunday';
    const opens = minutesOf(sunday ? ground.sundayOpens : ground.opens);
  const closes = minutesOf(sunday ? ground.sundayCloses : ground.closes);
  // where a time falls on the day's strip, as a percentage of the opening hours
  const at = (iso) => `${((minutesOf(hhmm(iso)) - opens) / (closes - opens)) * 100}%`;
    const span = (from, to) => ({ left: at(from), width: `calc(${at(to)} - ${at(from)})` });
  const hours = [];
  for (let m = opens; m <= closes; m += 240) hours.push(m);

    return (
    <div className={`result result-ok place pencil is-${stage}`}>
          <ol className="place-steps" aria-label="Steps">
                  <li className={stage === 'pencil' ? 'is-now' : 'is-done'}>
          <span>{stage === 'pencil' ? '1' : <Icon name="check" size={12} strokeWidth={3} />}</span> Pencil it on {ground.name}
        </li>
                <li className={stage === 'done' ? 'is-done' : stage === 'holding' ? 'is-now' : ''}>
          <span>{stage === 'done' ? <Icon name="check" size={12} strokeWidth={3} /> : '2'}</span> Ground held
        </li>
                </ol>

       <div className="place-stage pencil-stage">
        <div className="pencil-day">
            <p className="pencil-day-name">{ground.name} · {longDate(booking.from.slice(0, 10))}</p>
                      <div className={`pencil-strip${over ? ' is-over' : ''}${dragging ? ' is-waiting' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); pencilIn(); }}>
          {stage !== 'pencil' && <span className="pencil-held" style={span(heldFrom, heldTo)} aria-hidden="true" />}
            <span className={`pencil-slot${stage === 'pencil' ? '' : ' is-filled'}`} style={span(booking.from, booking.to)}>
              {stage !== 'pencil' && <span className="pencil-slot-id mono">{id}</span>}
            </span>
              </div>
             <div className="pencil-hours mono" aria-hidden="true">
            {hours.map((m) => (
              <span key={m} style={{ left: `${((m - opens) / (closes - opens)) * 100}%` }}>{String(Math.floor(m / 60)).padStart(2, '0')}:00</span>
            ))}
          </div>
          </div>

        {stage === 'pencil' && (
          <div className="pencil-tray">
                      <svg className="place-guide pencil-guide" viewBox="0 0 40 50" aria-hidden="true">
              <path d="M34 46 C 34 28, 26 14, 12 6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
              <path d="M11 17 L11 5 L22 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
                        <button type="button" className={`pencil-card${dragging ? ' is-dragging' : ''}`} draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; setDragging(true); }}
              onDragEnd={() => { setDragging(false); setOver(false); }}
              onClick={pencilIn}
              aria-label={`Booking ${id}, ${eventName}, ${hhmm(booking.from)} to ${hhmm(booking.to)}. Pencil it on ${ground.name}`}>
                            <span className="pencil-card-id mono">{id}</span>
              <span className="pencil-card-line">{eventName} · {hhmm(booking.from)}–{hhmm(booking.to)}</span>
              {club && <span className="pencil-card-club">{club}</span>}
            </button>
        </div>
        )}

        </div>
              <div className="place-caption" aria-live="polite">
                      {stage === 'pencil' && (
          <> 
          <p className="place-title">Drag <span className="mono">{id}</span> onto its slot</p>
            <p className="place-text">Or tap the booking. The dashed box is {hhmm(booking.from)}–{hhmm(booking.to)}.</p>
        </>
        )}
        {stage === 'holding' && <p className="place-title">Holding the ground…</p>}
        {stage === 'done' && (
          <>
            <p className="place-title">{ground.name} is held {hhmm(heldFrom)}–{hhmm(heldTo)}</p>
            <p className="place-text">
              The match plus its setup and teardown. Confirm it by {longDate(dayOf(holdUntil))}, {hhmm(holdUntil)}, or the hold lapses.
                            {' '}<button type="button" className="link-btn" onClick={() => onOpen(id)}>Open the booking card <Icon name="arrow" size={14} /></button>
            </p>
                    </>
        )}
        
         
        </div>
     {stage === 'done' && (
        <button type="button" className="btn btn-primary btn-lg btn-block place-ok" onClick={onDone} autoFocus>
          OK, next request
        </button>
      )}
      </div>


  );
}