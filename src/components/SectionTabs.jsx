import { NavLink } from 'react-router-dom';
import { PERSONAS } from '../data/personas.js';
import Icon from './Icon.jsx';

/**
 * The sections of a person with more than one screen (the clerk), shown in the page's title row. The current one is
 */

export default function SectionTabs({ personaId }) {
  const persona = PERSONAS.find((p) => p.id === personaId);
    return (
    <nav className="section-tabs" aria-label={`${persona.name}'s screens`} style={{ '--persona': persona.color }}>
      {persona.nav.map((item) => (
                <NavLink key={item.to} to={item.to} end
          className={({ isActive }) => `section-tab${isActive ? ' is-active' : ''}`}>
                    <Icon name={item.icon} size={17} strokeWidth={2} />
          <span>{item.label}</span>
                  </NavLink>
      ))}
    </nav>
  );
}