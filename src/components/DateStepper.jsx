import { useSearchParams } from 'react-router-dom';
import Icon from './Icon.jsx';
import { addDays, longDate, nextSaturday } from '../data/days.js';

/** The date a screen shows, kept in the address bar (?date=), next Saturday when none, or no real day, is given. */
export function useDate() {
  const [params, setParams] = useSearchParams();
  const asked = params.get('date');
    const real = asked && /^\d{4}-\d{2}-\d{2}$/.test(asked) && !Number.isNaN(Date.parse(`${asked}T00:00:00Z`))
    && new Date(`${asked}T00:00:00Z`).toISOString().slice(0, 10) === asked;
      const date = real ? asked : nextSaturday(Date.now());
  const setDate = (d) => {
    const next = new URLSearchParams(params);
        next.set('date', d);
    setParams(next);
  };
  return [date, setDate];
}

/** ‹ Saturday 3 October › : one day back or on. */
export default function DateStepper({ date, onChange }) {
  return (
        <div className="date-step" role="group" aria-label="Day">
              <button type="button" className="icon-btn" onClick={() => onChange(addDays(date, -1))} aria-label="The day before"><Icon name="back" size={16} /></button>
                    <span className="date-label">{longDate(date)}</span>
      <button type="button" className="icon-btn" onClick={() => onChange(addDays(date, 1))} aria-label="The day after"><Icon name="forward" size={16} /></button>
            </div>
            
      );
}