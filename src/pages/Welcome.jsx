import { Link } from 'react-router-dom';
import { Avatar } from '../components/Header.jsx';
import DayStrip from '../components/DayStrip.jsx';
import Icon from '../components/Icon.jsx';
import { VENUE } from '../data/complex.js';
import { nextSaturday } from '../data/days.js';
import { PERSONAS } from '../data/personas.js';
import { useGet } from '../hooks/useApi.jsx';
/** The first screen: what GroundBook is, next Saturday on ground A, and who you want to be. */
export default function Welcome() {

const grounds = useGet(`/venues/${VENUE.slug}/grounds`);
const types = useGet(`/venues/${VENUE.slug}/event-types`);
const day = useGet(`/venues/${VENUE.slug}/grounds/A/day?date=${nextSaturday(Date.now())}`);

    return (
    <div className="welcome">
      <section className="hero">
        <div className="hero-copy">
                  <p className="eyebrow">{VENUE.name} · the planner</p>
          <h1 className="hero-title">
            Four grounds.<br />
            <span>No pencil on the wall.</span>
          </h1>
                    <p className="hero-lede">
             Every booking holds its ground with the setup before it and the teardown after it, two bookings never 
            overlap once those are counted, and every request, confirmation, move and cancellation stays on record.
          </p>
        <div className="hero-facts">
            <div><strong>{grounds?.body?.grounds?.length ?? 4}</strong><span>grounds</span></div>
            <div><strong>{types?.body?.eventTypes?.length ?? 6}</strong><span>event types</span></div>
                        <div><strong className="is-free">{day?.body?.bookings?.filter((b) => b.state !== 'cancelled').length ?? 0}</strong><span>held next Saturday on A</span></div>
          </div>
        </div>
      <div className="hero-art" aria-hidden="true">
                          <div className="hero-planner">{day?.status === 200 && <DayStrip day={day.body} compact />}</div>
      </div>
      </section>
    
          <section className="pick" aria-labelledby="pick-title">
                  <div className="pick-head">
          <h2 id="pick-title" className="section-title">Who are you today?</h2>
          <p className="section-sub">Each person sees their own screens. Everything they do changes the same planner.</p>
        </div>
                <div className="pick-grid pick-grid-3">
          {PERSONAS.map((p, i) => (
                        <Link key={p.id} to={p.nav[0].to} className="pick-card" style={{ '--persona': p.color, '--i': i }}>
              <Avatar persona={p} size={44} />
                            <span className="pick-name">{p.name}</span>
              <span className="pick-role">{p.role}</span>
              <span className="pick-blurb">{p.blurb}</span>
              <span className="pick-go">Continue as {p.name} <Icon name="arrow" size={16} /></span>
                          </Link>
                      ))}
        </div>
                </section>
                
    </div>
  );
}



