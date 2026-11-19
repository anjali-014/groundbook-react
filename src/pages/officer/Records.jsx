import BookingsBrowser from '../../components/BookingsBrowser.jsx';
import { VENUE } from '../../data/complex.js';

/** Aruna's records: every booking of a day with its record, nothing to change and nothing erased. */
export default function Records() {
  return (
    <div className="page is-fit">
      <div className="page-head">
        <div>
                  <p className="eyebrow">{VENUE.name} · the planner’s record</p>
                  <h1 className="page-title">Records</h1>
        </div>
      </div>
     <BookingsBrowser empty="When Deepa requests a slot, its record starts here." />
          </div>
  );
}