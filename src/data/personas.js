// The people in GroundBook's stories. Each one sees their own screens. Sabu, Deepa and Rafi are named in the stories;
// the municipal officer is not, and is called Anita here. Rafi, the club secretary, rings Deepa: his requests are the 
// ones she types in.
export const PERSONAS = [
    {
    id: 'caretaker', name: 'Sabu', role: 'Caretaker', color: '#0f766e',
    blurb: 'Looks after the four grounds. Reads each ground’s day: the bookings and the setup and teardown around them.',
    nav: [{ to: '/caretaker/day', label: 'The day', icon: 'grid' }],
  },
    {
    id: 'clerk', name: 'Deepa', role: 'Booking clerk', color: '#b45309',
    blurb: 'Takes the clubs’ calls. Requests slots, confirms them, cancels them and moves them.',
        nav: [
      { to: '/clerk/book', label: 'Book', icon: 'plus' },
      { to: '/clerk/bookings', label: 'Bookings', icon: 'list' },
    ],
  },
    {
    id: 'officer', name: 'Anita', role: 'Municipal officer', color: '#be123c',
    blurb: 'Answers for the complex. Reads every booking’s record.',
    nav: [{ to: '/officer/records', label: 'Records', icon: 'book' }],
  },
  ];
  /** The persona whose screens the path belongs to, e.g. '/clerk/book' → Deepa. */
export function personaForPath(pathname) {
  const first = pathname.split('/')[1];
    const byRoute = { caretaker: 'caretaker', clerk: 'clerk', officer: 'officer' };
  return PERSONAS.find((p) => p.id === byRoute[first]) ?? null;
}