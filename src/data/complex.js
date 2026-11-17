// The complex the screens show, and the states a booking can be in (for the legend). The grounds and the event types
//  themselves come from the API.
export const VENUE = { slug: 'deccan', name: 'Deccan Sports Complex' };

/** A booking's states. */
export const STATES = [
    { id: 'requested', name: 'Requested' },
  { id: 'confirmed', name: 'Confirmed' },
  { id: 'cancelled', name: 'Cancelled' },
];

/** A state's name as the screens write it, e.g. 'requested' → 'Requested'. */
export const stateName = (id) => STATES.find((s) => s.id === id)?.name ?? '';