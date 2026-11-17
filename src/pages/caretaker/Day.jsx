import DayStrip from '../../components/DayStrip.jsx';
import { STATES, VENUE } from '../../data/complex.js';
import { nextSaturday } from '../../data/days.js';
import { useGet } from '../../hooks/useApi.jsx';

/** One ground's strip for the day: GET /venues/deccan/grounds/{ground}/day?date=. */
function GroundDay({ ground, date }) {
  const answer = useGet(`/venues/${VENUE.slug}/grounds/${ground}/day?date=${date}`);
    if (answer?.status !== 200) return null;
  return <DayStrip day={answer.body} />;
}
/** Sabu's day: the four grounds as strips from opening to closing, each booking a block with the ground held around it. */
export default function Day() {
  const date = nextSaturday(Date.now());
  const grounds = useGet(`/venues/${VENUE.slug}/grounds`);

  return (
    <div className="page is-fit">
      <div className="page-head">
      <div>
                <p className="eyebrow">{VENUE.name} · the planner</p>
          <h1 className="page-title">The day</h1>
      </div>
      </div>


      <div className="planner">
        {grounds?.status === 200 && grounds.body.grounds.map((g) => <GroundDay key={g.ground} ground={g.ground} date={date} />)}
      </div>

      <ul className="legend legend-below legend-wrap" aria-label="Legend">
        {STATES.map((s) => <li key={s.id}><span className={`dot is-${s.id}`} /> {s.name}</li>)}
          <li className="muted">The lighter edge either side: the ground held for setup and teardown</li>
        </ul>
    </div>
      );
}