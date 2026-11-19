import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, cancel, clockAt, confirm, india, moveClockTo, person, wait } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const card = () => screen.getByRole('article');
const findCard = () => screen.findByRole('article');
const row = (id) => screen.getByRole('row', { name: new RegExp(id) });
const bodyRows = () => screen.getAllByRole('row').filter((r) => within(r).queryAllByRole('cell').length > 0);
const press = (user, name) => user.click(within(card()).getByRole('button', { name }));
const leagueMatch = async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); };
const threeBookings = async (api) => {
  await book(api, 'A', 'League match', '14:00', '17:00');
  await book(api, 'C', 'Friendly match', '10:00', '12:00');
  await book(api, 'A', 'Practice', '17:50', '19:00');
};

async function openBookings(path = '/clerk/bookings', before = leagueMatch, { at = TUE_1343, then } = {}) {
  clockAt(at);
  const app = await openApp(path, { before });
  if (then) moveClockTo(then);
  await screen.findByRole('button', { name: 'The day after' });
  return { ...app, user: person() };
}

describe("F-08 · The clerk's bookings", () => {
  test('Bookings says "Deccan Sports Complex · the clubs’ slots" over the title, with the day picker on next Saturday', async () => {
    await openBookings();
    expect(screen.getByText('Deccan Sports Complex · the clubs’ slots')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Bookings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'The day before' })).toBeInTheDocument();
    expect(screen.getByText('Saturday 7 November')).toBeInTheDocument();
  });

  test('the table has Booking, Ground, Event, Slot and State, and its rows BK0002, BK0001, BK0003 in the order they start', async () => {
    await openBookings('/clerk/bookings', threeBookings);
    await screen.findByRole('table');
    const heads = screen.getAllByRole('columnheader').map((h) => h.textContent).filter(Boolean);
    expect(heads).toEqual(['Booking', 'Ground', 'Event', 'Slot', 'State']);
    const cells = bodyRows().map((r) => within(r).getAllByRole('cell').map((c) => c.textContent).filter(Boolean));
    expect(cells).toEqual([
      ['BK0002', 'C', 'Friendly match', '10:00–12:00', 'Requested'],
      ['BK0001', 'A', 'League match', '14:00–17:00', 'Requested'],
      ['BK0003', 'A', 'Practice', '17:50–19:00', 'Requested'],
    ]);
  });

  test("beside the table the first row's card is open: BK0002 with its day and ground, state, Event, Slot and Ground held", async () => {
    await openBookings('/clerk/bookings', threeBookings);
    const open = await findCard();
    expect(await within(open).findByText('Saturday 7 November · Ground C')).toBeInTheDocument();
    expect(within(open).getByText(reading('BK0002', 'Requested'))).toBeInTheDocument();
    expect(within(open).getByText(reading('Event', 'Friendly match'))).toBeInTheDocument();
    expect(within(open).getByText(reading('Slot', '10:00–12:00'))).toBeInTheDocument();
    expect(within(open).getByText(reading('Ground held', '09:30–12:20'))).toBeInTheDocument();
  });

  test('the row whose card is open, BK0002 at first, is read as the current one, and only that row', async () => {
    await openBookings('/clerk/bookings', threeBookings);
    await findCard();
    expect(row('BK0002')).toHaveAttribute('aria-current', 'true');
    expect(row('BK0001')).not.toHaveAttribute('aria-current');
    expect(row('BK0003')).not.toHaveAttribute('aria-current');
  });

  test("clicking BK0001's row opens its card and puts ?id=BK0001 in the address", async () => {
    const { user, address } = await openBookings('/clerk/bookings', threeBookings);
    await within(await findCard()).findByText('Saturday 7 November · Ground C');
    await user.click(within(row('BK0001')).getByText('League match'));
    expect(await within(card()).findByText('Saturday 7 November · Ground A')).toBeInTheDocument();
    expect(within(card()).getByText(reading('BK0001', 'Requested'))).toBeInTheDocument();
    expect(address()).toMatch(/[?&]id=BK0001$/);
    expect(row('BK0001')).toHaveAttribute('aria-current', 'true');
    expect(row('BK0002')).not.toHaveAttribute('aria-current');
  });

  test('the arrow "Open BK0001" opens its card too', async () => {
    const { user, address } = await openBookings('/clerk/bookings', threeBookings);
    await findCard();
    await user.click(screen.getByRole('button', { name: 'Open BK0001' }));
    expect(await within(card()).findByText(reading('Slot', '14:00–17:00'))).toBeInTheDocument();
    expect(within(card()).getByText(reading('BK0001', 'Requested'))).toBeInTheDocument();
    expect(address()).toMatch(/[?&]id=BK0001$/);
  });

  test('the address /clerk/bookings?date=2026-11-07&id=BK0001 opens Saturday 7 November with BK0001\'s card', async () => {
    await openBookings('/clerk/bookings?date=2026-11-07&id=BK0001', threeBookings);
    expect(screen.getByText('Saturday 7 November')).toBeInTheDocument();
    expect(await within(await findCard()).findByText(reading('BK0001', 'Requested'))).toBeInTheDocument();
    expect(within(card()).getByText('Saturday 7 November · Ground A')).toBeInTheDocument();
  });

  test('The day after shows that day\'s bookings with the first card, and the booking number leaves the address', async () => {
    const { user, address } = await openBookings('/clerk/bookings?date=2026-11-07&id=BK0001', async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'B', 'Practice', '09:00', '10:00', { date: '2026-11-08' });
    });
    await within(await findCard()).findByText('Saturday 7 November · Ground A');
    await user.click(screen.getByRole('button', { name: 'The day after' }));
    expect(await within(await findCard()).findByText('Sunday 8 November · Ground B')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /BK0001/ })).not.toBeInTheDocument();
    expect(row('BK0002')).toBeInTheDocument();
    expect(address()).not.toContain('BK0001');
    expect(address()).toContain('2026-11-08');
  });

  test('a day with no bookings says "No booking that day" and "Request a slot on Book; it appears here with its card."', async () => {
    await openBookings('/clerk/bookings?date=2026-11-14');
    expect(await screen.findByText('No booking that day')).toBeInTheDocument();
    expect(screen.getByText('Request a slot on Book; it appears here with its card.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('before every ground\'s day has arrived only the day picker shows; then the table appears', async () => {
    clockAt(TUE_1343);
    await openApp('/clerk/bookings', { before: leagueMatch });
    expect(screen.getByRole('button', { name: 'The day after' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByText('No booking that day')).not.toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  test('?id=BK9999 says "No such booking" and "There is no booking BK9999." where the card goes', async () => {
    await openBookings('/clerk/bookings?date=2026-11-07&id=BK9999');
    expect(await screen.findByText('No such booking')).toBeInTheDocument();
    expect(screen.getByText('There is no booking BK9999.')).toBeInTheDocument();
  });

  test('Confirm on a requested booking says "Confirmed at 13:43." and the card and the table say Confirmed', async () => {
    const { user } = await openBookings();
    await within(await findCard()).findByText(reading('BK0001', 'Requested'));
    await press(user, 'Confirm');
    expect(await within(card()).findByText('Confirmed at 13:43.')).toBeInTheDocument();
    expect(await within(card()).findByText(reading('BK0001', 'Confirmed'))).toBeInTheDocument();
    expect(await within(row('BK0001')).findByText('Confirmed')).toBeInTheDocument();
    expect(within(row('BK0001')).queryByText('Requested')).not.toBeInTheDocument();
  });

  test('Confirm on a confirmed booking says "Already confirmed" and "The booking is already confirmed. Nothing changed."', async () => {
    const { user } = await openBookings('/clerk/bookings', async (api) => { await leagueMatch(api); await confirm(api, 'BK0001'); });
    await within(await findCard()).findByText(reading('BK0001', 'Confirmed'));
    await press(user, 'Confirm');
    expect(await within(card()).findByText('Already confirmed')).toBeInTheDocument();
    expect(within(card()).getByText('The booking is already confirmed. Nothing changed.')).toBeInTheDocument();
  });

  test('Cancel before the slot begins says "Cancelled." and the card and the table say Cancelled', async () => {
    const { user } = await openBookings();
    await within(await findCard()).findByText(reading('BK0001', 'Requested'));
    await press(user, 'Cancel');
    expect(await within(card()).findByText('Cancelled.')).toBeInTheDocument();
    expect(await within(card()).findByText(reading('BK0001', 'Cancelled'))).toBeInTheDocument();
    expect(await within(row('BK0001')).findByText('Cancelled')).toBeInTheDocument();
  });

  test('cancelling from a block on The day drops the ground\'s held count by one and leaves the block on the strip', async () => {
    clockAt(TUE_1343);
    await openApp('/caretaker/day', { before: leagueMatch });
    const user = person();
    const a = await screen.findByRole('region', { name: 'Ground A' });
    await user.click(await within(a).findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' }));
    await press(user, 'Cancel');
    expect(await within(card()).findByText('Cancelled.')).toBeInTheDocument();
    const after = screen.getByRole('region', { name: 'Ground A' });
    expect(await within(after).findByText(reading('06:00–22:00 · 0 held'))).toBeInTheDocument();
    expect(within(after).getByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Cancelled' })).toBeInTheDocument();
  });

  test('Cancel after the slot has begun says "Cancelled late: the slot had already begun." and the block stays, cancelled', async () => {
    const { user } = await openBookings('/caretaker/day?date=2026-11-07', leagueMatch, { then: india('2026-11-07', '15:00') });
    await user.click(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' }));
    await press(user, 'Cancel');
    expect(await within(card()).findByText('Cancelled late: the slot had already begun.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Cancelled' })).toBeInTheDocument();
  });

  test('Cancel on a cancelled booking says "Already cancelled" and "The booking is already cancelled. Nothing changed."', async () => {
    const { user } = await openBookings('/clerk/bookings', async (api) => { await leagueMatch(api); await cancel(api, 'BK0001'); });
    await within(await findCard()).findByText(reading('BK0001', 'Cancelled'));
    await press(user, 'Cancel');
    expect(await within(card()).findByText('Already cancelled')).toBeInTheDocument();
    expect(within(card()).getByText('The booking is already cancelled. Nothing changed.')).toBeInTheDocument();
  });

  test('Confirm on a cancelled booking says "It was cancelled" and "Request a new booking instead."', async () => {
    const { user } = await openBookings('/clerk/bookings', async (api) => { await leagueMatch(api); await cancel(api, 'BK0001'); });
    await within(await findCard()).findByText(reading('BK0001', 'Cancelled'));
    await press(user, 'Confirm');
    expect(await within(card()).findByText('It was cancelled')).toBeInTheDocument();
    expect(within(card()).getByText('Request a new booking instead.')).toBeInTheDocument();
  });

  test('Confirm on a requested booking whose slot has begun says "It has already begun"', async () => {
    const { user } = await openBookings('/clerk/bookings?date=2026-11-07', leagueMatch, { then: india('2026-11-07', '15:00') });
    await within(await findCard()).findByText(reading('BK0001', 'Requested'));
    await press(user, 'Confirm');
    expect(await within(card()).findByText('It has already begun')).toBeInTheDocument();
    expect(within(card()).getByText('The interval has begun; it can no longer be confirmed or moved.')).toBeInTheDocument();
    expect(within(card()).getByText(reading('BK0001', 'Requested'))).toBeInTheDocument();
  });

  test('Cancel on a booking whose slot has ended says "It has already ended"', async () => {
    const { user } = await openBookings('/clerk/bookings?date=2026-11-07', leagueMatch, { then: india('2026-11-07', '18:00') });
    await within(await findCard()).findByText(reading('BK0001', 'Requested'));
    await press(user, 'Cancel');
    expect(await within(card()).findByText('It has already ended')).toBeInTheDocument();
    expect(within(card()).getByText('The interval has ended; it can no longer be cancelled.')).toBeInTheDocument();
  });

  test('the card that opens from a block on The day has Confirm and Cancel with the same answers', async () => {
    clockAt(TUE_1343);
    await openApp('/caretaker/day', { before: leagueMatch });
    const user = person();
    await user.click(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' }));
    await within(screen.getByRole('dialog')).findByRole('article');
    await press(user, 'Confirm');
    expect(await within(card()).findByText('Confirmed at 13:43.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Confirmed' })).toBeInTheDocument();
    await press(user, 'Confirm');
    expect(await within(card()).findByText('Already confirmed')).toBeInTheDocument();
    expect(within(card()).getByText('The booking is already confirmed. Nothing changed.')).toBeInTheDocument();
  });

  test('"Open the booking card" on Book\'s last step opens Bookings on that day with its card', async () => {
    clockAt(TUE_1343);
    const { address } = await openApp('/clerk/book');
    const user = person();
    await within(await screen.findByRole('button', { name: /^Event type/ })).findByText('League match');
    await user.click(screen.getByRole('button', { name: 'Request' }));
    await user.click(await screen.findByRole('button', { name: 'Booking BK0001, League match, 14:00 to 17:00. Pencil it on Ground A' }));
    await wait(1200);
    await user.click(await screen.findByRole('button', { name: /Open the booking card/ }));
    expect(address()).toMatch(/^\/clerk\/bookings\?/);
    expect(address()).toContain('2026-11-07');
    expect(address()).toContain('BK0001');
    expect(screen.getByRole('heading', { level: 1, name: 'Bookings' })).toBeInTheDocument();
    expect(await within(await findCard()).findByText(reading('BK0001', 'Requested'))).toBeInTheDocument();
  });

  test('Tab reaches the day picker, each row\'s arrow, then Confirm and Cancel; Enter on an arrow opens that booking', async () => {
    const { user } = await openBookings('/clerk/bookings', threeBookings);
    await within(await findCard()).findByText('Saturday 7 November · Ground C');
    for (let i = 0; i < 30 && document.activeElement !== screen.getByRole('button', { name: 'The day before' }); i += 1) await user.tab();
    const order = ['The day before', 'The day after', 'Open BK0002', 'Open BK0001', 'Open BK0003', 'Confirm', 'Cancel'];
    expect(screen.getByRole('button', { name: order[0] })).toHaveFocus();
    for (const name of order.slice(1)) {
      await user.tab();
      expect(screen.getByRole('button', { name })).toHaveFocus();
    }
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Open BK0003' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await within(card()).findByText(reading('BK0003', 'Requested'))).toBeInTheDocument();
  });
});
