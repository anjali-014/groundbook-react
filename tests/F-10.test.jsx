import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, cancel, clockAt, confirm, india, move, moveClockTo, person } from './given.js';
import { pageWords, reading, wordsOf } from './look.js';

afterEach(() => vi.useRealTimers());

const card = () => screen.getByRole('article');
const findCard = () => screen.findByRole('article');
const row = (id) => screen.getByRole('row', { name: new RegExp(id) });
const bodyRows = () => screen.getAllByRole('row').filter((r) => within(r).queryAllByRole('cell').length > 0);
/** The record's lines, as a person reads each one. */
const lines = () => within(within(card()).getByRole('list')).getAllByRole('listitem').map(wordsOf);
const leagueMatch = async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); };

async function openRecords(before = leagueMatch, { path = '/officer/records', then } = {}) {
  clockAt(TUE_1343);
  const app = await openApp(path, { before });
  if (then) moveClockTo(then);
  await screen.findByRole('button', { name: 'The day after' });
  return { ...app, user: person() };
}

/** Waits for the open card's record to have this many lines. */
async function recordOf(count) {
  await within(await findCard()).findByText(reading('The record', 'nobody can erase it'));
  await vi.waitFor(() => expect(lines()).toHaveLength(count), { timeout: 5000 });
  return lines();
}

describe("F-10 · The officer's records", () => {
  test('Records says "Deccan Sports Complex · the planner’s record" over the title, with no tabs and the day picker on next Saturday', async () => {
    await openRecords();
    expect(screen.getByText('Deccan Sports Complex · the planner’s record')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Records' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /screens/ })).not.toBeInTheDocument();
    expect(screen.getByText('Saturday 7 November')).toBeInTheDocument();
  });

  test('a day with bookings shows the same table, in start order, with the first card open; a row\'s arrow opens another', async () => {
    const { user, address } = await openRecords(async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'C', 'Friendly match', '10:00', '12:00');
    });
    await screen.findByRole('table');
    const heads = screen.getAllByRole('columnheader').map((h) => h.textContent).filter(Boolean);
    expect(heads).toEqual(['Booking', 'Ground', 'Event', 'Slot', 'State']);
    expect(bodyRows().map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual(['BK0002', 'BK0001']);
    expect(await within(await findCard()).findByText('Saturday 7 November · Ground C')).toBeInTheDocument();
    await user.click(within(row('BK0001')).getByRole('button', { name: 'Open BK0001' }));
    expect(await within(card()).findByText('Saturday 7 November · Ground A')).toBeInTheDocument();
    expect(address()).toMatch(/[?&]id=BK0001$/);
  });

  test('a booking\'s card on Records has no Confirm, no Cancel and no Move', async () => {
    await openRecords();
    await recordOf(1);
    expect(within(card()).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    expect(within(card()).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(within(card()).queryByRole('button', { name: 'Move' })).not.toBeInTheDocument();
    expect(within(card()).queryAllByRole('textbox')).toHaveLength(0);
    expect(within(card()).queryAllByRole('button')).toHaveLength(0);
  });

  test('a day with no bookings says "No booking that day" and "When Deepa requests a slot, its record starts here."', async () => {
    await openRecords(undefined, { path: '/officer/records?date=2026-11-14' });
    expect(await screen.findByText('No booking that day')).toBeInTheDocument();
    expect(screen.getByText('When Deepa requests a slot, its record starts here.')).toBeInTheDocument();
  });

  test('a booking just made for 14:00–17:00 has "The record", "nobody can erase it" and one line Requested 14:00–17:00 at 11-03 13:43', async () => {
    await openRecords();
    const record = await recordOf(1);
    expect(record[0]).toMatch(/^Requested .*14:00–17:00.* 11-03 13:43$/);
  });

  test('after a confirmation the record has a second line, Confirmed, with its time', async () => {
    await openRecords(async (api) => { await leagueMatch(api); await confirm(api, 'BK0001'); });
    const record = await recordOf(2);
    expect(record[0]).toMatch(/^Requested /);
    expect(record[1]).toMatch(/^Confirmed .*11-03 13:43$/);
  });

  test('after a move from 14:00–17:00 to 13:00–16:00 the record has a line Moved 14:00–17:00 → 13:00–16:00', async () => {
    await openRecords(async (api) => { await leagueMatch(api); await move(api, 'BK0001', '13:00', '16:00'); });
    const record = await recordOf(2);
    expect(record[1]).toMatch(/^Moved .*14:00–17:00 → 13:00–16:00.* 11-03 13:43$/);
  });

  test('a booking cancelled before its slot began has a line Cancelled, before the slot began', async () => {
    await openRecords(async (api) => { await leagueMatch(api); await cancel(api, 'BK0001'); });
    const record = await recordOf(2);
    expect(record[1]).toMatch(/^Cancelled .*before the slot began/);
    expect(record[1]).not.toMatch(/late/);
  });

  test('a booking cancelled after its slot began has a line Cancelled late, after the slot began', async () => {
    clockAt(TUE_1343);
    await openApp('/officer/records?date=2026-11-07', {
      before: async (api) => {
        await leagueMatch(api);
        moveClockTo(india('2026-11-07', '15:00'));
        await cancel(api, 'BK0001');
      },
    });
    const record = await recordOf(2);
    expect(record[1]).toMatch(/^Cancelled late .*after the slot began.* 11-07 15:00$/);
  });

  test('with several changes the lines run oldest first, and the first line still says 14:00–17:00 after the move', async () => {
    clockAt(TUE_1343);
    await openApp('/officer/records', {
      before: async (api) => {
        await leagueMatch(api);
        moveClockTo(india('2026-11-03', '15:10'));
        await confirm(api, 'BK0001');
        moveClockTo(india('2026-11-04', '09:05'));
        await move(api, 'BK0001', '13:00', '16:00');
        moveClockTo(india('2026-11-05', '18:20'));
        await cancel(api, 'BK0001');
      },
    });
    const record = await recordOf(4);
    expect(record[0]).toMatch(/^Requested .*14:00–17:00.* 11-03 13:43$/);
    expect(record[1]).toMatch(/^Confirmed .*11-03 15:10$/);
    expect(record[2]).toMatch(/^Moved .*14:00–17:00 → 13:00–16:00.* 11-04 09:05$/);
    expect(record[3]).toMatch(/^Cancelled .*before the slot began.* 11-05 18:20$/);
  });

  test('a refused Confirm, Cancel or Move adds no line to the record', async () => {
    await openRecords(async (api) => {
      await leagueMatch(api);
      await book(api, 'A', 'Practice', '17:50', '19:00');
      await confirm(api, 'BK0001');
      await api.post('/bookings/BK0001/confirm');
      await api.post('/bookings/BK0001/move', { from: '2026-11-07T15:00:00Z', to: '2026-11-07T18:00:00Z' });
      await cancel(api, 'BK0001');
      await api.post('/bookings/BK0001/cancel');
      await api.post('/bookings/BK0001/confirm');
    }, { path: '/officer/records?date=2026-11-07&id=BK0001' });
    const record = await recordOf(3);
    expect(record.map((l) => l.split(' ')[0])).toEqual(['Requested', 'Confirmed', 'Cancelled']);
  });

  test('the club typed on Book is not in the record', async () => {
    await openRecords();
    const record = await recordOf(1);
    expect(record.join(' ')).not.toContain('Deccan Gymkhana');
    expect(wordsOf(card())).not.toContain('Deccan Gymkhana');
    expect(pageWords()).not.toContain('Deccan Gymkhana');
  });

  test("Deepa's card on Bookings shows the same record, and it gains a line straight after Confirm", async () => {
    clockAt(TUE_1343);
    await openApp('/clerk/bookings', { before: leagueMatch });
    const user = person();
    expect((await recordOf(1))[0]).toMatch(/^Requested .*14:00–17:00/);
    await user.click(within(card()).getByRole('button', { name: 'Confirm' }));
    const record = await recordOf(2);
    expect(record[1]).toMatch(/^Confirmed /);
  });

  test("Sabu's card from a block on The day shows the same record, and it gains a line straight after a Move", async () => {
    clockAt(TUE_1343);
    await openApp('/caretaker/day', { before: leagueMatch });
    const user = person();
    await user.click(await screen.findByRole('button', { name: 'BK0001, League match, 14:00 to 17:00, Requested' }));
    expect((await recordOf(1))[0]).toMatch(/^Requested .*14:00–17:00/);
    await user.type(within(card()).getByRole('textbox', { name: 'Move from' }), '13:00');
    await user.type(within(card()).getByRole('textbox', { name: 'Move to' }), '16:00{Enter}');
    const record = await recordOf(2);
    expect(record[1]).toMatch(/^Moved .*14:00–17:00 → 13:00–16:00/);
    await user.click(within(card()).getByRole('button', { name: 'Cancel' }));
    expect((await recordOf(3))[2]).toMatch(/^Cancelled /);
  });

  test('Tab reaches the day picker and each row\'s arrow; Enter opens that booking and its record', async () => {
    const { user } = await openRecords(async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'C', 'Friendly match', '10:00', '12:00');
      await confirm(api, 'BK0001');
    });
    await recordOf(1);
    for (let i = 0; i < 30 && document.activeElement !== screen.getByRole('button', { name: 'The day before' }); i += 1) await user.tab();
    expect(screen.getByRole('button', { name: 'The day before' })).toHaveFocus();
    for (const name of ['The day after', 'Open BK0002', 'Open BK0001']) {
      await user.tab();
      expect(screen.getByRole('button', { name })).toHaveFocus();
    }
    await user.keyboard('{Enter}');
    await within(card()).findByText('Saturday 7 November · Ground A');
    const record = await recordOf(2);
    expect(record[1]).toMatch(/^Confirmed /);
  });
});
