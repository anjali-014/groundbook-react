import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, cancel, clockAt, confirm, person } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const strip = (ground) => screen.getByRole('region', { name: `Ground ${ground}` });
const findStrip = (ground) => screen.findByRole('region', { name: `Ground ${ground}` });

async function openDay(before) {
  clockAt(TUE_1343);
  const app = await openApp('/caretaker/day', { before });
  await findStrip('A');
  return app;
}

describe('F-03 · The day', () => {
  test('The day has "Deccan Sports Complex · the planner" over the title and four strips, Ground A to Ground D', async () => {
    await openDay();
    expect(screen.getByText('Deccan Sports Complex · the planner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'The day' })).toBeInTheDocument();
    for (const g of ['A', 'B', 'C', 'D']) {
      expect(await findStrip(g)).toBeInTheDocument();
      expect(within(strip(g)).getByText(`Ground ${g}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('region', { name: /^Ground [A-Z]$/ })).toHaveLength(4);
  });

  test('the strips are for next Saturday: a booking that day shows, one on another day does not', async () => {
    await openDay(async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'A', 'Practice', '09:00', '10:00', { date: '2026-11-06' });
      await book(api, 'A', 'Practice', '09:00', '10:00', { date: '2026-11-14' });
    });
    expect(await within(strip('A')).findByText('BK0001')).toBeInTheDocument();
    expect(screen.queryByText('BK0002')).not.toBeInTheDocument();
    expect(screen.queryByText('BK0003')).not.toBeInTheDocument();
  });

  test('on an empty Saturday each strip reads "06:00–22:00 · 0 held" with marks 06:00, 08:00 … 22:00', async () => {
    await openDay();
    for (const g of ['A', 'B', 'C', 'D']) {
      const s = await findStrip(g);
      expect(within(s).getByText(reading('06:00–22:00 · 0 held'))).toBeInTheDocument();
      for (const mark of ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']) {
        expect(within(s).getByText(mark)).toBeInTheDocument();
      }
      expect(within(s).queryByText('07:00')).not.toBeInTheDocument();
    }
  });

  test('a League match 14:00–17:00 on Ground A is a block with "BK0001" and "League match · 14:00–17:00"', async () => {
    await openDay(async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); });
    const a = strip('A');
    expect(await within(a).findByText('BK0001')).toBeInTheDocument();
    expect(await within(a).findByText('League match · 14:00–17:00')).toBeInTheDocument();
    expect(within(strip('B')).queryByText('BK0001')).not.toBeInTheDocument();
  });

  test('with that booking Ground A\'s head reads "06:00–22:00 · 1 held" and the other grounds still 0 held', async () => {
    await openDay(async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); });
    expect(await within(strip('A')).findByText(reading('06:00–22:00 · 1 held'))).toBeInTheDocument();
    expect(within(strip('B')).getByText(reading('06:00–22:00 · 0 held'))).toBeInTheDocument();
  });

  test('several bookings on one ground read from left to right in the order they start', async () => {
    await openDay(async (api) => {
      await book(api, 'A', 'Practice', '17:50', '19:00');
      await book(api, 'A', 'Friendly match', '07:00', '09:00');
      await book(api, 'A', 'League match', '12:00', '15:00');
    });
    const a = strip('A');
    await within(a).findByText('BK0003');
    expect(within(a).getAllByText(/^BK\d{4}$/).map((b) => b.textContent)).toEqual(['BK0002', 'BK0003', 'BK0001']);
    expect(await within(a).findByText('Friendly match · 07:00–09:00')).toBeInTheDocument();
    expect(within(a).getByText('League match · 12:00–15:00')).toBeInTheDocument();
    expect(within(a).getByText('Practice · 17:50–19:00')).toBeInTheDocument();
    expect(within(a).getByText(reading('06:00–22:00 · 3 held'))).toBeInTheDocument();
  });

  test('a cancelled booking stays on the strip but is not counted in "held"', async () => {
    await openDay(async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      const second = await book(api, 'A', 'Practice', '18:00', '19:00');
      await confirm(api, 'BK0001');
      await cancel(api, second.bookingId);
    });
    const a = strip('A');
    expect(await within(a).findByText('BK0002')).toBeInTheDocument();
    expect(within(a).getByText('BK0001')).toBeInTheDocument();
    expect(within(a).getByText(reading('06:00–22:00 · 1 held'))).toBeInTheDocument();
  });

  test('under the strips the legend reads Requested, Confirmed, Cancelled and the line about the lighter edge', async () => {
    await openDay();
    expect(screen.getByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('The lighter edge either side: the ground held for setup and teardown')).toBeInTheDocument();
  });

  test('before the days arrive the title is there and the strips are not; then each strip appears', async () => {
    clockAt(TUE_1343);
    await openApp('/caretaker/day');
    expect(screen.getByRole('heading', { level: 1, name: 'The day' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /^Ground [A-Z]$/ })).not.toBeInTheDocument();
    expect(screen.queryByText(reading('06:00–22:00 · 0 held'))).not.toBeInTheDocument();
    for (const g of ['A', 'B', 'C', 'D']) expect(await findStrip(g)).toBeInTheDocument();
  });

  test('a booking made while Sabu was away shows on The day when he comes back', async () => {
    const { api } = await openDay();
    const user = person();
    expect(within(strip('A')).getByText(reading('06:00–22:00 · 0 held'))).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'GroundBook home' }));
    await book(api, 'A', 'League match', '14:00', '17:00');
    await user.click(screen.getByRole('link', { name: /Continue as Sabu/ }));
    expect(await within(await findStrip('A')).findByText('BK0001')).toBeInTheDocument();
    expect(within(strip('A')).getByText(reading('06:00–22:00 · 1 held'))).toBeInTheDocument();
  });

  test('a screen reader hears each block by number, event, times and state, and each strip by its ground', async () => {
    await openDay(async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'B', 'Practice', '08:00', '09:00');
      await book(api, 'B', 'Friendly match', '10:00', '12:00');
      await confirm(api, 'BK0002');
      await cancel(api, 'BK0003');
    });
    const a = strip('A');
    const b = strip('B');
    expect(await within(a).findByLabelText('BK0001, League match, 14:00 to 17:00, Requested')).toBeInTheDocument();
    expect(within(b).getByLabelText('BK0002, Practice, 08:00 to 09:00, Confirmed')).toBeInTheDocument();
    expect(within(b).getByLabelText('BK0003, Friendly match, 10:00 to 12:00, Cancelled')).toBeInTheDocument();
  });
});
