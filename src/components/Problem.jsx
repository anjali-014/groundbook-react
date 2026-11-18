import { explain } from '../data/messages.js';
import Icon from './Icon.jsx';

/** A refusal, shown the same way on every screen: what happened, and what to do next. */
export default function Problem({ answer, compact = false }) {
    const { title, text } = explain(answer);
  return (
            <div className={`problem${compact ? ' is-compact' : ''}`} role="alert">
      <span className="problem-icon"><Icon name="alert" size={compact ? 16 : 20} /></span>
      <span className="problem-icon"><Icon name="alert" size={20} /></span>
            <div className="problem-body">
        <p className="problem-title">{title}</p>
        {text && <p className="problem-text">{text}</p>}
      </div>
          </div>
      );
}