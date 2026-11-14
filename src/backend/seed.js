// PROVIDED: do not edit.
// The starting data, the same records the MERN backend seeds from seed/grounds.csv and seed/event_types.csv: the
// Deccan venue, its four grounds with their opening hours (Sunday has its own) and its six event types, each with the
// setup and teardown minutes it needs. There are no bookings yet.
export const SEED = {
  venues: [{ slug: 'deccan', name: 'Deccan' }],
  grounds: [
    { venueId: 'deccan', code: 'A', name: 'Ground A', opens: '06:00', closes: '22:00', sundayOpens: '07:00', sundayCloses: '20:00' },
    { venueId: 'deccan', code: 'B', name: 'Ground B', opens: '06:00', closes: '22:00', sundayOpens: '07:00', sundayCloses: '20:00' },
    { venueId: 'deccan', code: 'C', name: 'Ground C', opens: '06:00', closes: '22:00', sundayOpens: '07:00', sundayCloses: '20:00' },
    { venueId: 'deccan', code: 'D', name: 'Ground D', opens: '06:00', closes: '22:00', sundayOpens: '07:00', sundayCloses: '20:00' },
  ],
  eventTypes: [
    { venueId: 'deccan', code: 'practice', name: 'Practice', setupMinutes: 20, teardownMinutes: 20 },
    { venueId: 'deccan', code: 'friendly', name: 'Friendly match', setupMinutes: 30, teardownMinutes: 20 },
    { venueId: 'deccan', code: 'league', name: 'League match', setupMinutes: 40, teardownMinutes: 30 },
    { venueId: 'deccan', code: 'athletics', name: 'Athletics meet', setupMinutes: 60, teardownMinutes: 45 },
    { venueId: 'deccan', code: 'tournament', name: 'Tournament', setupMinutes: 90, teardownMinutes: 60 },
    { venueId: 'deccan', code: 'school_day', name: 'School sports day', setupMinutes: 120, teardownMinutes: 120 },
  ],
};
