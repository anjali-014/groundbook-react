import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { VENUE } from '../data/complex.js';
import { PERSONAS, personaForPath } from '../data/personas.js';
import Icon from './Icon.jsx';
import useDismiss from './useDismiss.js';
export function Avatar({ persona, size = 34 }) {
  return (
    <span className="avatar" style={{ '--avatar': persona.color, width: size, height: size, fontSize: size * 0.42 }}>
      {persona.name[0]}
    </span>
      );
}

function PersonaMenu({ current }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
    const box = useRef(null);
  const button = useRef(null);
    // Esc closes the list and puts the focus back on the menu's button; a click outside just closes it
  useDismiss(box, open, (how) => {
    setOpen(false);
        if (how === 'escape') button.current?.focus();
  });

    function choose(persona) {
    setOpen(false);
    navigate(persona.nav[0].to);
  }

  return (
    <div className="persona-menu" ref={box}>
          <button type="button" className="persona-current" ref={button} onClick={() => setOpen(!open)} aria-expanded={open}>
        <Avatar persona={current} size={30} />
        <span className="persona-current-text">
          <span className="persona-current-name">{current.name}</span>
          <span className="persona-current-role">{current.role}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
           </button>
        {open && (
        <div className="persona-popover" role="menu">
          <p className="popover-label">View the planner as</p>
          {PERSONAS.map((p) => (
            <button key={p.id} type="button" role="menuitem" className={`persona-option${p.id === current.id ? ' is-current' : ''}`} onClick={() => choose(p)} aria-current={p.id === current.id ? 'true' : undefined}>
                                    <Avatar persona={p} size={34} />
              <span>
                <span className="persona-option-name">{p.name}</span>
                <span className="persona-option-role">{p.role}</span>
              </span>
              {p.id === current.id && <Icon name="check" size={16} className="persona-option-check" />}
                                  </button>
                                   ))}
        </div>
      )}
        </div>
  );
}
  

export default function Header() {
  const { pathname } = useLocation();
  const persona = personaForPath(pathname);

    return (
    <header className="header">
          <div className="header-inner">
        <div className="header-start">
                  {persona && (
            <Link to="/" className="back-home" aria-label="Back to the home page" title="Back to the home page">
              <Icon name="back" size={20} />
            </Link>
          )}
          <Link to="/" className="brand" aria-label="GroundBook home">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
            <span className="brand-text">
          <span className="brand-name">GroundBook</span>
              <span className="brand-place">{VENUE.name}</span>
            </span>
          </Link>
              </div>

                      <div className="header-tools">
                                {persona && <PersonaMenu current={persona} />}
                              </div>
                    </div>
        </header>
  );
}