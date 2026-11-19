import BookingsBrowser from '../../components/BookingsBrowser.jsx';
import SectionTabs from '../../components/SectionTabs.jsx';
import { VENUE } from '../../data/complex.js';

/**  Deepa's bookings: a day's bookings, each with its card. */
export default function Bookings() {
  return (
        <div className="page is-fit">
      <div className="page-head">
        <div>
                  <p className="eyebrow">{VENUE.name} · the clubs’ slots</p>
                  <h1 className="page-title">Bookings</h1>
        </div>
        <SectionTabs personaId="clerk" />
              </div>
                    <BookingsBrowser />
                  </div>
  );
}