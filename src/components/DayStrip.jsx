import { stateName } from '../data/complex.js';
import { hhmm, minutesOf } from '../data/days.js';
import { useEventNames } from '../hooks/useApi.jsx';

/**
 * One ground's day (GET /venues/deccan/grounds/{ground}/day) as a strip from opening to closing. Each booking is a
  * block for its booked time with a lighter shadow either side: the ground held for setup and teardown. The colour
 * says the state: requested, confirmed, or cancelled (greyed; it holds nothing). Each block names its events
 * (from GET …/events), never its code.
 * picture: each block shows its booking number.
 */
export default function DayStrip({ day, compact = false}) {
  const open = minutesOf(day.opens);
  const close = minutesOf(day.closes);
    const span = close - open;
  const pos = (iso) => ((minutesOf(hhmm(iso)) - open) / span) * 100;
    const clamp = (x) => Math.max(0, Math.min(100, x));
      const hours = [];
  for (let m = Math.ceil(open / 60) * 60; m <= close; m += 120) hours.push(m);
    const bookings = day.bookings ?? [];
    const names = useEventNames() ?? {};
      return (
       <section className={`strip${compact ? ' is-compact' : ''}`} aria-label={`Ground ${day.ground}`}>
        <header className="strip-head">
        <span className="strip-name">Ground {day.ground}</span>
        <span className="mono">{day.opens}–{day.closes} · {bookings.filter((b) => b.state !== 'cancelled').length} held</span>
      </header>
          <div className="strip-scroll">
        <div className="strip-track">
            {hours.map((m, i) => (
                <span key={m} className={`strip-tick${i === 0 ? ' is-first' : ''}${i === hours.length - 1 ? ' is-last' : ''}`} style={{ left: `${((m - open) / span) * 100}%` }}>
                <span className="mono">{String(Math.floor(m / 60)).padStart(2, '0')}:00</span>
                            </span>
             ))}
              {bookings.map((b, i) => {
            const id = b.bookingId;
            const hf = clamp(pos(b.groundHeldFrom));
            const ht = clamp(pos(b.groundHeldTo));
            const f = clamp(pos(b.from));
            const t = clamp(pos(b.to));
                        return (
          <span key={id} className={`block is-${b.state}`} style={{ left: `${hf}%`, width: `${ht - hf}%`, '--i': i }} aria-label={`${id}, ${names[b.event] ?? ''}, ${hhmm(b.from)} to ${hhmm(b.to)}, ${stateName(b.state)}`}>
          <span className="block-match" style={{ left: `${((f - hf) / Math.max(0.0001, ht - hf)) * 100}%`, width: `${((t - f) / Math.max(0.0001, ht - hf)) * 100}%` }}>
                  <span className="block-label mono">{id}</span>
                  {!compact && <span className="block-note">{names[b.event]} · {hhmm(b.from)}–{hhmm(b.to)}</span>}
                </span>
                </span>
            );
              })}
                </div>
      </div>
        </section>
  );
}