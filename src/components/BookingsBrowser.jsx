import { useSearchParams } from 'react-router-dom';
import BookingCard from './BookingCard.jsx';
import DateStepper, { useDate } from './DateStepper.jsx';
import Icon from './Icon.jsx';
import { hhmm } from '../data/days.js';
import { VENUE, stateName } from '../data/complex.js';
import { useEventNames, useGet, useGetEach } from '../hooks/useApi.jsx';

/**
 * A day's bookings on every hall (GET …/halls/{hall}/day for each hall; there is no call that lists bookings),
 * each opening its card (GET /bookings/{id}).
 */
export default function BookingsBrowser() {
    const [date] = useDate();
  const [params, setParams] = useSearchParams();
  const grounds = useGet(`/venues/${VENUE.slug}/grounds`);
  const codes = grounds?.status === 200 ? grounds.body.grounds.map((g) => g.ground) : [];
    const days = useGetEach(codes.map((g) => `/venues/${VENUE.slug}/grounds/${g}/day?date=${date}`));
  const names = useEventNames();
  // nothing is shown until every hall has answered, and the occasions with their names
  const loaded = codes.length > 0 && days?.length === codes.length && names !== null;
    const rows = (loaded ? days : []).flatMap((d) => (d.status === 200 ? d.body.bookings.map((b) => ({ ...b, ground: d.body.ground })) : []))
    .sort((a, b) => a.from.localeCompare(b.from));
  const selected = params.get('id') ?? rows[0]?.bookingId ?? null;
  const choose = (id) => { const next = new URLSearchParams(params); next.set('id', id); setParams(next); };

      return (
    <>
          <div className="toolbar"><DateStepper date={date} onChange={(d) => { const next = new URLSearchParams(params); next.set('date', d); next.delete('id'); setParams(next); }} /></div>
                {!loaded ? null : rows.length === 0 && !params.get('id') ? (
                          <div className="empty">
          <Icon name="list" size={28} />
          <p className="empty-title">No booking that day</p>
          <p className="empty-text">Request a slot on Book; it appears here with its card.</p>
        </div>
                        ) : (
        <div className="bookings-split">
                  <div className="table-card">
            <table className="table">
                          <thead><tr><th>Booking</th><th>Ground</th><th>Event</th><th>Slot</th><th>State</th><th aria-label="Open" /></tr></thead>
              <tbody>
              {rows.map((b, i) => (
                  <tr key={b.bookingId} className={`is-openable${b.bookingId === selected ? ' is-current' : ''}`} style={{ '--i': i }} onClick={() => choose(b.bookingId)} aria-current={b.bookingId === selected ? 'true' : undefined}>
                                      <td className="mono strong">{b.bookingId}</td>
                    <td className="mono">{b.ground}</td>
                    <td>{names[b.event]}</td>
                    <td className="mono">{hhmm(b.from)}–{hhmm(b.to)}</td>
                                        <td><span className={`state-pill is-${b.state}`}>{stateName(b.state)}</span></td>
                    <td><button type="button" className="row-link" aria-label={`Open ${b.bookingId}`} onClick={(e) => { e.stopPropagation(); choose(b.bookingId); }}><Icon name="arrow" size={16} /></button></td>
                                    </tr>
                ))}
                </tbody>
                        </table>
          </div>
                  {selected && <BookingCard key={selected} id={selected} />}
                </div>
      )}
        </>
  );
}


