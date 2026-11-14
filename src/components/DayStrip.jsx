import { hhmm, minutesOf } from '../data/days.js';

/**
 * One ground's day (GET /venues/deccan/grounds/{ground}/day) as a strip from opening to closing. Each booking is a
 * block for its match with a lighter shadow either side: the ground held for setup and teardown. Drawn small, as a
 * picture: each block shows its booking number.
 */
export default function DayStrip({ day }) {
  const open = minutesOf(day.opens);
  const close = minutesOf(day.closes);
    const span = close - open;
  const pos = (iso) => ((minutesOf(hhmm(iso)) - open) / span) * 100;
    const clamp = (x) => Math.max(0, Math.min(100, x));
      const hours = [];
  for (let m = Math.ceil(open / 60) * 60; m <= close; m += 120) hours.push(m);
    const bookings = day.bookings ?? [];
      return (
    <section className="strip is-compact">
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
          <span key={id} className="block" style={{ left: `${hf}%`, width: `${ht - hf}%`, '--i': i }}>
          <span className="block-match" style={{ left: `${((f - hf) / Math.max(0.0001, ht - hf)) * 100}%`, width: `${((t - f) / Math.max(0.0001, ht - hf)) * 100}%` }}>
                  <span className="block-label mono">{id}</span>
                </span>
                </span>
            );
              })}
                </div>
      </div>
        </section>
  );
}