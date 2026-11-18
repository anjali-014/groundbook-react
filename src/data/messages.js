// The refusals the backend gives, in the words of the person who meets them. The backend gives one shape (type,
// title, status, detail, and its extras); this builds the screen's own sentence from the type and the extras, never
// from the backend's wording, and says what to do next.

/** What each box is called when the clerk is told to fill it in or fix it. */
const BOXES = {
  from: { missing: 'Type the time it starts, like 14:00.', wrong: 'Write the start time in 24-hour form, like 09:00 or 14:00.' },
  to: { missing: 'Type the time it ends, like 17:00.', wrong: 'Write the end time in 24-hour form, like 09:00 or 17:00.' },
    club: { missing: 'Type the club’s name.', wrong: 'Type the club’s name.' },
  ground: { missing: 'Pick a ground.', wrong: 'Pick a ground.' },
  event: { missing: 'Pick an event type.', wrong: 'Pick an event type.' },
    date: { missing: 'Pick a day.', wrong: 'Pick a day.' },
};
const LENGTH = 'An interval lasts from 30 minutes to 12 hours.';

/** What is wrong with one field: it is empty, it is too short or too long a slot, or it is not written right. */
function problemOf(error) {
  if (error.field === 'to' && /30 minutes/.test(error.message)) return 'length';
    if (error.message === 'Required' || /at least 1 character/.test(error.message)) return 'missing';
  return 'wrong';
}

/**
 * The words for the boxes the answer names, limited to `fields` when given (in the order the form shows them), as
 * one line. Empty when none of those boxes is named.
 */
export function fieldText(errors = [], fields = null) {
  const named = errors.filter((e) => !fields || fields.includes(e.field));
  const seen = new Map();
  for (const e of named) if (!seen.has(e.field)) seen.set(e.field, problemOf(e));
    const words = [];
  for (const [field, problem] of seen) {
    words.push(problem === 'length' ? LENGTH : (BOXES[field] ?? { missing: 'Fill in every box.', wrong: 'Check what you typed.' })[problem]);
      }
  return [...new Set(words)].join(' ');
}

/** Why a slot cannot be booked: the hours when the refusal gives them, otherwise which of the interval's rules it broke. */
function badSlot(body) {
  if (body.opens) return `With setup and teardown, the ground would be held outside its hours: it is open ${body.opens}–${body.closes} that day.`;
    if (/end after/.test(body.detail)) return 'The interval must end after it starts.';
  if (/past/.test(body.detail)) return 'Nobody books the past.';
  if (/same date/.test(body.detail)) return 'The interval must start and end on the same date.';
  return 'Pick other times.';
}

export function explain(answer) {
  const body = answer.body ?? {};
  switch (body.type) {
        case '/errors/validation':
      return { title: 'Something in the form is not right', text: fieldText(body.errors) || 'Check what you typed.' };
    case '/errors/bad-interval':
      return { title: 'That slot cannot be booked', text: badSlot(body) };
          case '/errors/no-such-ground': return { title: 'No such ground', text: 'That ground is not here. The grounds are A to D.' };
    case '/errors/no-such-event-type': return { title: 'No such event type', text: 'Pick one of the event types on the list.' };
    case '/errors/no-such-venue': return { title: 'That complex is not here', text: 'This planner is the Deccan Sports Complex only.' };
    case '/errors/internal': return { title: 'Something went wrong', text: 'Please try again.' };
        default:
      return { title: 'That did not work', text: 'Please try again.' };
  }
}