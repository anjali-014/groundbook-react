import { useState } from 'react';
import api from '../../api.js';
import Dropdown from '../../components/Dropdown.jsx';
import Icon from '../../components/Icon.jsx';
import Problem from '../../components/Problem.jsx';
import SectionTabs from '../../components/SectionTabs.jsx';
import { useDate } from '../../components/DateStepper.jsx';
import { VENUE } from '../../data/complex.js';
import { instant, longDate, openPicker } from '../../data/days.js';
import { fieldText } from '../../data/messages.js';
import { useGet } from '../../hooks/useApi.jsx';

/** The answer to "request a slot": why not, when it is refused. */
function RequestResult({ answer }) {
  if (!answer || answer.status === 201) {
    return (
      <div className="result result-idle">
        <Icon name="grid" size={28} />
        <p className="result-title">Request a slot</p>
        <p className="result-text">The ground is held with its setup before and its teardown after, for as long as the hold lasts.</p>
      </div>
    );
  }
  return <div className="result result-no"><Problem answer={answer} /></div>;
}

/**
 *  Deepa's Book screen: POST /bookings with the ground (GET …/grounds), the event type (GET …/event-types), the
 * interval and the club.
 */
export default function Book() {
  const [date] = useDate();
  const [day, setDay] = useState(date);
  const [ground, setGround] = useState('A');
  const [event, setEvent] = useState('league');
  const [from, setFrom] = useState('14:00');
  const [to, setTo] = useState('17:00');
  const [club, setClub] = useState('Deccan Gymkhana');
  const [answer, setAnswer] = useState(null);
  const groundsAnswer = useGet(`/venues/${VENUE.slug}/grounds`);
  const types = useGet(`/venues/${VENUE.slug}/event-types`);
  const grounds = groundsAnswer?.status === 200 ? groundsAnswer.body.grounds : [];
  const list = types?.status === 200 ? types.body.eventTypes : [];

  // the boxes a refused request names are outlined in red, with the screen's own words for what to fix under them
  const errors = answer?.body?.errors ?? [];
  const bad = new Set(errors.map((e) => e.field));
  const dayWords = fieldText(errors, ['date']);
  const timeWords = fieldText(errors, ['from', 'to']);
  const clubWords = fieldText(errors, ['club']);

  async function request(e) {
    e.preventDefault();
    if (!day) {
      // an empty Day box: nothing is sent, and the screen names the box itself, the way the backend names the others
      setAnswer({ status: 400, body: { type: '/errors/validation', errors: [{ field: 'date', message: 'Required' }] } });
      return;
    }
    const body = { ground, event, club };
    if (from) body.from = instant(day, from);
    if (to) body.to = instant(day, to);
    setAnswer(await api.post('/bookings', body));
  }

  return (
    <div className="page is-fit">
      <div className="page-head">
        <div>
          <p className="eyebrow">{VENUE.name}{day && ` · ${longDate(day)}`}</p>
          <h1 className="page-title">Book</h1>
        </div>
        <SectionTabs personaId="clerk" />
      </div>

      <div className="split">
        <form className="card form" onSubmit={request} noValidate>
          <fieldset className="form-fields">
            <div className="field">
              <label className="field-label" htmlFor="bk-date"><span className="step-no">1</span> Day</label>
              <div className={`input-wrap${bad.has('date') ? ' has-error' : ''}`}><input id="bk-date" onClick={openPicker} className="input mono" type="date" value={day} onChange={(e) => { setDay(e.target.value); setAnswer(null); }} aria-invalid={bad.has('date')} /></div>
              {dayWords && <p className="field-error">{dayWords}</p>}
            </div>

            <div className="field">
              <span className="field-label"><span className="step-no">2</span> Ground and event</span>
              <div className="segmented" role="group" aria-label="Ground">
                {grounds.map((g) => (
                  <button key={g.ground} type="button" aria-pressed={ground === g.ground} className={`seg${ground === g.ground ? ' is-on' : ''}`}
                    onClick={() => { setGround(g.ground); setAnswer(null); }}>{g.name}</button>
                ))}
              </div>
              <Dropdown id="bk-event" label="Event type" value={event} onChange={(v) => { setEvent(v); setAnswer(null); }}
                options={list.map((t) => ({ value: t.code, label: t.name, note: `${t.setupMinutes} min before · ${t.teardownMinutes} after` }))} />
            </div>

            <div className="field-row">
              <div className="field">
                <span className="field-label"><span className="step-no">3</span> From and to</span>
                <div className="move-form">
                  <div className={`input-wrap${bad.has('from') ? ' has-error' : ''}`}><input id="bk-from" className="input mono" type="text" inputMode="numeric" placeholder="14:00" maxLength={5} value={from} onChange={(e) => { setFrom(e.target.value); setAnswer(null); }} aria-label="From" aria-invalid={bad.has('from')} /></div>
                  <span className="muted">to</span>
                  <div className={`input-wrap${bad.has('to') ? ' has-error' : ''}`}><input id="bk-to" className="input mono" type="text" inputMode="numeric" placeholder="17:00" maxLength={5} value={to} onChange={(e) => { setTo(e.target.value); setAnswer(null); }} aria-label="To" aria-invalid={bad.has('to')} /></div>
                </div>
                <p className={timeWords ? 'field-error' : 'field-help'}>{timeWords || 'The match itself, 24-hour (14:00). The setup and teardown are added from the event type.'}</p>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="bk-club"><span className="step-no">4</span> Club</label>
                <div className={`input-wrap${bad.has('club') ? ' has-error' : ''}`}><input id="bk-club" className="input" value={club} onChange={(e) => { setClub(e.target.value); setAnswer(null); }} aria-invalid={bad.has('club')} /></div>
                <p className={clubWords ? 'field-error' : 'field-help'}>{clubWords || 'Kept on the booking; never in its record.'}</p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block">
              Request <Icon name="arrow" size={18} />
            </button>
          </fieldset>
        </form>

        <div className="result-slot">
          <RequestResult answer={answer} />
        </div>
      </div>
    </div>
  );
}
