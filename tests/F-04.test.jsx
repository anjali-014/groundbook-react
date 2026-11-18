import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, clockAt, person } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const strip = (ground) => screen.getByRole('region', { name: `Ground ${ground}` });
const findStrip = (ground) => screen.findByRole('region', { name: `Ground ${ground}` });
const before = () => screen.getByRole('button', { name: 'The day before' });
const after = () => screen.getByRole('button', { name: 'The day after' });
const BLOCK = 'BK0001, League match, 14:00 to 17:00, Requested';
const leagueMatch = async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); };

async function openDay(path = '/caretaker/day', before) {
  clockAt(TUE_1343);
  const app = await openApp(path, { before });
  await findStrip('A');
  return { ...app, user: person() };
}

async function openBlock(path = '/caretaker/day') {
  const app = await openDay(path, leagueMatch);
  await app.user.click(await screen.findByRole('button', { name: BLOCK }));
  return { ...app, panel: screen.getByRole('dialog') };
}

describe('F-04 · Another day, and what each event needs', () => {
  test('the title row says "Saturday 7 November" between the buttons The day before and The day after', async () => {
    await openDay();
    expect(screen.getByText('Saturday 7 November')).toBeInTheDocument();
    expect(before()).toBeInTheDocument();
    expect(after()).toBeInTheDocument();
    expect(before().compareDocumentPosition(screen.getByText('Saturday 7 November')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Saturday 7 November').compareDocumentPosition(after()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('The day after shows Sunday 8 November, its bookings, and ?date=2026-11-08 in the address', async () => {
    const { user, address } = await openDay('/caretaker/day', async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'B', 'Practice', '09:00', '10:00', { date: '2026-11-08' });
    });
    await within(strip('A')).findByText('BK0001');
    await user.click(after());
    expect(screen.getByText('Sunday 8 November')).toBeInTheDocument();
    expect(address()).toMatch(/[?]date=2026-11-08$/);
    expect(await within(strip('B')).findByText('BK0002')).toBeInTheDocument();
    expect(screen.queryByText('BK0001')).not.toBeInTheDocument();
  });

  test('The day before on Sunday 8 November goes back to Saturday 7 November', async () => {
    const { user, address } = await openDay('/caretaker/day?date=2026-11-08', leagueMatch);
    expect(screen.getByText('Sunday 8 November')).toBeInTheDocument();
    await user.click(before());
    expect(screen.getByText('Saturday 7 November')).toBeInTheDocument();
    expect(address()).not.toContain('2026-11-08');
    expect(await within(strip('A')).findByText('BK0001')).toBeInTheDocument();
  });

  test('on a Sunday the strips run 07:00–20:00, not 06:00–22:00', async () => {
    const { user } = await openDay();
    await user.click(after());
    for (const g of ['A', 'B', 'C', 'D']) {
      expect(await within(strip(g)).findByText(reading('07:00–20:00 · 0 held'))).toBeInTheDocument();
    }
    expect(screen.queryByText(/06:00–22:00/)).not.toBeInTheDocument();
  });

  test('the address ?date=2026-11-14 shows Saturday 14 November, and opening it again keeps it', async () => {
    await openDay('/caretaker/day?date=2026-11-14');
    expect(screen.getByText('Saturday 14 November')).toBeInTheDocument();
    await openDay('/caretaker/day?date=2026-11-14', async (api) => {
      await book(api, 'C', 'Practice', '09:00', '10:00', { date: '2026-11-14' });
    });
    expect(screen.getAllByText('Saturday 14 November').length).toBeGreaterThan(0);
    expect(await screen.findByText('BK0001')).toBeInTheDocument();
  });

  test('a day that does not exist, ?date=2026-13-45, shows next Saturday', async () => {
    await openDay('/caretaker/day?date=2026-13-45', leagueMatch);
    expect(screen.getByText('Saturday 7 November')).toBeInTheDocument();
    expect(await within(strip('A')).findByText('BK0001')).toBeInTheDocument();
  });

  test('the row under the title has the six event types, each with its minutes before and after', async () => {
    await openDay();
    const chips = screen.getByRole('group', { name: 'Event types and their buffers' });
    const types = [
      ['Practice', '20 before · 20 after'],
      ['Friendly match', '30 before · 20 after'],
      ['League match', '40 before · 30 after'],
      ['Athletics meet', '60 before · 45 after'],
      ['Tournament', '90 before · 60 after'],
      ['School sports day', '120 before · 120 after'],
    ];
    for (const [name, minutes] of types) {
      expect(await within(chips).findByText(reading(name, minutes))).toBeInTheDocument();
    }
    expect(within(chips).getAllByText(/^\d+ before · \d+ after$/)).toHaveLength(6);
  });

  test('clicking BK0001 opens a panel with "Booking" over "BK0001" and the booking\'s card', async () => {
    const { panel } = await openBlock();
    expect(within(panel).getByText(reading('Booking', 'BK0001'))).toBeInTheDocument();
    expect(await within(panel).findByText('Saturday 7 November · Ground A')).toBeInTheDocument();
    expect(within(panel).getByText(reading('BK0001', 'Requested'))).toBeInTheDocument();
    expect(within(panel).getByText(reading('Event', 'League match'))).toBeInTheDocument();
    expect(within(panel).getByText(reading('Slot', '14:00–17:00'))).toBeInTheDocument();
    expect(within(panel).getByText(reading('Ground held', '13:20–17:30'))).toBeInTheDocument();
  });

  test('✕ (Close) closes the panel and the strip is as it was', async () => {
    const { user } = await openBlock();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: BLOCK })).toBeInTheDocument();
    expect(within(strip('A')).getByText(reading('06:00–22:00 · 1 held'))).toBeInTheDocument();
  });

  test('Esc closes the panel', async () => {
    const { user } = await openBlock();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: BLOCK })).toBeInTheDocument();
  });

  test('the panel\'s head with the booking number is there at once, and the card follows when the booking arrives', async () => {
    await openDay('/caretaker/day', leagueMatch);
    fireEvent.click(await screen.findByRole('button', { name: BLOCK }));
    const panel = screen.getByRole('dialog');
    expect(within(panel).getByText(reading('Booking', 'BK0001'))).toBeInTheDocument();
    expect(within(panel).queryByText('Ground held')).not.toBeInTheDocument();
    expect(await within(panel).findByText(reading('Ground held', '13:20–17:30'))).toBeInTheDocument();
  });

  test('Tab reaches the two arrow buttons and then the blocks; Enter on a block opens it with the focus on ✕', async () => {
    const { user } = await openDay('/caretaker/day', async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'B', 'Practice', '08:00', '09:00');
    });
    const first = await screen.findByRole('button', { name: BLOCK });
    await screen.findByRole('button', { name: 'BK0002, Practice, 08:00 to 09:00, Requested' });
    for (let i = 0; i < 20 && document.activeElement !== before(); i += 1) await user.tab();
    expect(before()).toHaveFocus();
    await user.tab();
    expect(after()).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'BK0002, Practice, 08:00 to 09:00, Requested' })).toHaveFocus();
    await user.tab({ shift: true });
    await user.keyboard('{Enter}');
    const panel = screen.getByRole('dialog');
    expect(within(panel).getByText(reading('Booking', 'BK0001'))).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  test('Enter on ✕ closes the panel and the focus goes back to the block', async () => {
    const { user } = await openDay('/caretaker/day', leagueMatch);
    const block = await screen.findByRole('button', { name: BLOCK });
    for (let i = 0; i < 20 && document.activeElement !== block; i += 1) await user.tab();
    await user.keyboard('{Enter}');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: BLOCK })).toHaveFocus();
  });

  test('Esc closes the panel and the focus goes back to the block', async () => {
    const { user } = await openDay('/caretaker/day', leagueMatch);
    const block = await screen.findByRole('button', { name: BLOCK });
    for (let i = 0; i < 20 && document.activeElement !== block; i += 1) await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: BLOCK })).toHaveFocus();
  });
});
