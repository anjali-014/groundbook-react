import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, cancel, clockAt, confirm, india, moveClockTo, person } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const card = () => screen.getByRole('article');
const findCard = () => screen.findByRole('article');
const row = (id) => screen.getByRole('row', { name: new RegExp(id) });
const moveFrom = () => within(card()).getByRole('textbox', { name: 'Move from' });
const moveTo = () => within(card()).getByRole('textbox', { name: 'Move to' });
const MOVED = 'Moved to 13:00–16:00; the ground is held 12:20–16:30.';
const leagueMatch = async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); };
const twoOnA = async (api) => {
  await book(api, 'A', 'League match', '14:00', '17:00');
  await book(api, 'A', 'Practice', '17:50', '19:00');
};

async function openBookings(before = leagueMatch, { path = '/clerk/bookings?date=2026-11-07&id=BK0001', then } = {}) {
  clockAt(TUE_1343);
  const app = await openApp(path, { before });
  if (then) moveClockTo(then);
  await within(await findCard()).findByText(reading('Slot', '14:00–17:00'));
  await screen.findByRole('table');
  return { ...app, user: person() };
}

async function moveIt(user, from, to) {
  if (from) await user.type(moveFrom(), from);
  if (to) await user.type(moveTo(), to);
  await user.click(within(card()).getByRole('button', { name: 'Move' }));
}

describe('F-09 · Moving a booking', () => {
  test('under Confirm and Cancel the card has "Move to", two empty time boxes with "to" between them, and Move', async () => {
    await openBookings();
    const open = card();
    expect(within(open).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(open).getByText('Move to')).toBeInTheDocument();
    expect(within(open).getByText('to')).toBeInTheDocument();
    expect(moveFrom()).toHaveValue('');
    expect(moveTo()).toHaveValue('');
    expect(within(open).getAllByPlaceholderText('14:00')).toHaveLength(2);
    expect(within(open).getByRole('button', { name: 'Move' })).toBeInTheDocument();
  });

  test('moving BK0001 to 13:00–16:00 says where it went and the card and the table show the new times', async () => {
    const { user } = await openBookings();
    await moveIt(user, '13:00', '16:00');
    expect(await within(card()).findByText(MOVED)).toBeInTheDocument();
    expect(await within(card()).findByText(reading('Slot', '13:00–16:00'))).toBeInTheDocument();
    expect(within(card()).getByText(reading('Ground held', '12:20–16:30'))).toBeInTheDocument();
    expect(await within(row('BK0001')).findByText('13:00–16:00')).toBeInTheDocument();
  });

  test('after a move the block on The day sits at the new times', async () => {
    clockAt(TUE_1343);
    await openApp('/caretaker/day', { before: leagueMatch });
    const user = person();
    await user.click(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' }));
    await within(screen.getByRole('dialog')).findByRole('article');
    await moveIt(user, '13:00', '16:00');
    expect(await within(card()).findByText(MOVED)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'BK0001, League match, 13:00 to 16:00, Requested' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' })).not.toBeInTheDocument();
  });

  test('a confirmed booking that moves is still confirmed', async () => {
    const { user } = await openBookings(async (api) => { await leagueMatch(api); await confirm(api, 'BK0001'); });
    expect(within(card()).getByText(reading('BK0001', 'Confirmed'))).toBeInTheDocument();
    await moveIt(user, '13:00', '16:00');
    expect(await within(card()).findByText(MOVED)).toBeInTheDocument();
    expect(await within(card()).findByText(reading('Slot', '13:00–16:00'))).toBeInTheDocument();
    expect(within(card()).getByText(reading('BK0001', 'Confirmed'))).toBeInTheDocument();
    expect(within(row('BK0001')).getByText('Confirmed')).toBeInTheDocument();
  });

  test('moving BK0001 to 15:00–18:00 clashes with BK0002 held 17:30–19:20, and BK0001 stays at 14:00–17:00', async () => {
    const { user } = await openBookings(twoOnA);
    await moveIt(user, '15:00', '18:00');
    expect(await within(card()).findByText('With the buffers, it clashes')).toBeInTheDocument();
    expect(within(card()).getByText('It overlaps BK0002 (held 17:30–19:20). On paper the times may not touch; the setup and teardown do.')).toBeInTheDocument();
    expect(within(card()).getByText(reading('Slot', '14:00–17:00'))).toBeInTheDocument();
  });

  test('Move with both boxes empty says "Type the times it starts and ends, like 14:00 and 17:00."', async () => {
    const { user } = await openBookings();
    await moveIt(user, '', '');
    expect(await within(card()).findByText('Something in the form is not right')).toBeInTheDocument();
    expect(within(card()).getByText('Type the times it starts and ends, like 14:00 and 17:00.')).toBeInTheDocument();
  });

  test('Move 25:00 to 16:00 says "Write the start time in 24-hour form, like 09:00 or 14:00."', async () => {
    const { user } = await openBookings();
    await moveIt(user, '25:00', '16:00');
    expect(await within(card()).findByText('Something in the form is not right')).toBeInTheDocument();
    expect(within(card()).getByText('Write the start time in 24-hour form, like 09:00 or 14:00.')).toBeInTheDocument();
  });

  test('Move 18:00 to 15:00 says "That slot cannot be booked" and "The interval must end after it starts."', async () => {
    const { user } = await openBookings();
    await moveIt(user, '18:00', '15:00');
    expect(await within(card()).findByText('That slot cannot be booked')).toBeInTheDocument();
    expect(within(card()).getByText('The interval must end after it starts.')).toBeInTheDocument();
  });

  test('Move 14:00 to 14:15 says "An interval lasts from 30 minutes to 12 hours."', async () => {
    const { user } = await openBookings();
    await moveIt(user, '14:00', '14:15');
    expect(await within(card()).findByText('Something in the form is not right')).toBeInTheDocument();
    expect(within(card()).getByText('An interval lasts from 30 minutes to 12 hours.')).toBeInTheDocument();
  });

  test('a League match moved to 06:10–08:00 is refused with the ground\'s hours, 06:00–22:00', async () => {
    const { user } = await openBookings();
    await moveIt(user, '06:10', '08:00');
    expect(await within(card()).findByText('That slot cannot be booked')).toBeInTheDocument();
    expect(within(card()).getByText('With setup and teardown, the ground would be held outside its hours: it is open 06:00–22:00 that day.')).toBeInTheDocument();
  });

  test('moving a cancelled booking says "It was cancelled" and "Request a new booking instead."', async () => {
    const { user } = await openBookings(async (api) => { await leagueMatch(api); await cancel(api, 'BK0001'); });
    await moveIt(user, '13:00', '16:00');
    expect(await within(card()).findByText('It was cancelled')).toBeInTheDocument();
    expect(within(card()).getByText('Request a new booking instead.')).toBeInTheDocument();
  });

  test('moving a booking whose slot has begun says "It has already begun"', async () => {
    const { user } = await openBookings(leagueMatch, { then: india('2026-11-07', '15:00') });
    await moveIt(user, '18:00', '20:00');
    expect(await within(card()).findByText('It has already begun')).toBeInTheDocument();
    expect(within(card()).getByText('The interval has begun; it can no longer be confirmed or moved.')).toBeInTheDocument();
  });

  test('after a refused move nothing has moved: the card and the block keep 14:00–17:00', async () => {
    clockAt(TUE_1343);
    await openApp('/caretaker/day', { before: twoOnA });
    const user = person();
    await user.click(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' }));
    await within(screen.getByRole('dialog')).findByRole('article');
    await moveIt(user, '15:00', '18:00');
    expect(await within(card()).findByText('With the buffers, it clashes')).toBeInTheDocument();
    expect(within(card()).getByText(reading('Slot', '14:00–17:00'))).toBeInTheDocument();
    expect(within(card()).getByText(reading('Ground held', '13:20–17:30'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'BK0001, League match, 15:00 to 18:00, Requested' })).not.toBeInTheDocument();
  });

  test('a moved booking stays on its day: the card still says Saturday 7 November and the row is in that day\'s table', async () => {
    const { user } = await openBookings();
    await moveIt(user, '13:00', '16:00');
    await within(card()).findByText(MOVED);
    expect(await within(row('BK0001')).findByText('13:00–16:00')).toBeInTheDocument();
    expect(within(card()).getByText('Saturday 7 November · Ground A')).toBeInTheDocument();
    expect(screen.getByText('Saturday 7 November')).toBeInTheDocument();
  });

  test('the card that opens from a block on The day has the same "Move to" row with the same answers', async () => {
    clockAt(TUE_1343);
    await openApp('/caretaker/day', { before: leagueMatch });
    const user = person();
    await user.click(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' }));
    await within(screen.getByRole('dialog')).findByRole('article');
    expect(within(card()).getByText('Move to')).toBeInTheDocument();
    await moveIt(user, '18:00', '15:00');
    expect(await within(card()).findByText('The interval must end after it starts.')).toBeInTheDocument();
    await user.clear(moveFrom());
    await user.clear(moveTo());
    await moveIt(user, '13:00', '16:00');
    expect(await within(card()).findByText(MOVED)).toBeInTheDocument();
  });

  test('by keyboard: Tab into "Move from" and "Move to", type the times and Enter moves the booking', async () => {
    const { user } = await openBookings();
    for (let i = 0; i < 40 && document.activeElement !== moveFrom(); i += 1) await user.tab();
    expect(moveFrom()).toHaveFocus();
    await user.keyboard('13:00');
    await user.tab();
    expect(moveTo()).toHaveFocus();
    await user.keyboard('16:00{Enter}');
    expect(await within(card()).findByText(MOVED)).toBeInTheDocument();
  });

  test('Enter in the "Move from" box moves the booking too', async () => {
    const { user } = await openBookings();
    await user.type(moveTo(), '16:00');
    await user.type(moveFrom(), '13:00{Enter}');
    expect(await within(card()).findByText(MOVED)).toBeInTheDocument();
  });
});
