import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, clockAt, person } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const CLASH = 'It overlaps BK0001 (held 13:20–17:30). On paper the times may not touch; the setup and teardown do.';
const strip = (ground) => screen.getByRole('region', { name: `Ground ${ground}` });
const fromBox = () => screen.getByRole('textbox', { name: 'From' });
const toBox = () => screen.getByRole('textbox', { name: 'To' });
const leagueMatch = async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); };

async function openBook(before = leagueMatch) {
  clockAt(TUE_1343);
  const app = await openApp('/clerk/book', { before });
  await screen.findByRole('button', { name: 'Ground A' });
  await within(screen.getByRole('button', { name: /^Event type/ })).findByText('League match');
  await within(await screen.findByRole('region', { name: 'Ground A' })).findByText('BK0001');
  return { ...app, user: person() };
}

async function chooseEvent(user, name) {
  await user.click(screen.getByRole('button', { name: /^Event type/ }));
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: new RegExp(name) }));
}

async function setTimes(user, from, to) {
  await user.clear(fromBox());
  await user.type(fromBox(), from);
  await user.clear(toBox());
  await user.type(toBox(), to);
}

/** Asks for Ground A, Practice, from–to, and presses Request. */
async function askPractice(user, from = '17:00', to = '18:00') {
  await chooseEvent(user, 'Practice');
  await setTimes(user, from, to);
  await user.click(screen.getByRole('button', { name: 'Request' }));
}

describe('F-07 · When the day says no', () => {
  test('Practice 17:00–18:00 next to BK0001 is refused: "With the buffers, it clashes", naming BK0001 held 13:20–17:30', async () => {
    const { user } = await openBook();
    await askPractice(user);
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('With the buffers, it clashes')).toBeInTheDocument();
    expect(within(panel).getByText(CLASH)).toBeInTheDocument();
  });

  test('the refused slot is drawn on "Ground A that day" as a block labelled "refused"', async () => {
    const { user } = await openBook();
    expect(within(strip('A')).queryByText('refused')).not.toBeInTheDocument();
    await askPractice(user);
    await screen.findByRole('alert');
    expect(within(strip('A')).getByText('refused')).toBeInTheDocument();
    expect(within(strip('A')).getByText('BK0001')).toBeInTheDocument();
  });

  test('after the refusal Ground A\'s head still says 1 held', async () => {
    const { user } = await openBook();
    await askPractice(user);
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('With the buffers, it clashes')).toBeInTheDocument();
    expect(within(strip('A')).getByText('refused')).toBeInTheDocument();
    expect(within(strip('A')).getByText(reading('06:00–22:00 · 1 held'))).toBeInTheDocument();
    expect(within(strip('A')).queryByText('BK0002')).not.toBeInTheDocument();
  });

  test('Practice 17:50–19:00, whose setup starts exactly as BK0001\'s teardown ends, is accepted', async () => {
    const { user } = await openBook();
    await askPractice(user, '17:00', '18:00');
    expect(within(await screen.findByRole('alert')).getByText('With the buffers, it clashes')).toBeInTheDocument();
    await setTimes(user, '17:50', '19:00');
    await user.click(screen.getByRole('button', { name: 'Request' }));
    expect(await screen.findByRole('button', { name: 'Booking BK0002, Practice, 17:50 to 19:00. Pencil it on Ground A' })).toBeInTheDocument();
    expect(screen.queryByText('With the buffers, it clashes')).not.toBeInTheDocument();
    expect(within(strip('A')).queryByText('refused')).not.toBeInTheDocument();
  });

  test('a slot whose setup and teardown reach two bookings names both, each with the time it holds', async () => {
    const { user } = await openBook(async (api) => {
      await book(api, 'A', 'League match', '14:00', '17:00');
      await book(api, 'A', 'Practice', '17:50', '19:00');
    });
    await chooseEvent(user, 'Friendly match');
    await setTimes(user, '16:00', '18:00');
    await user.click(screen.getByRole('button', { name: 'Request' }));
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('With the buffers, it clashes')).toBeInTheDocument();
    expect(within(panel).getByText('It overlaps BK0001 (held 13:20–17:30), BK0002 (held 17:30–19:20). On paper the times may not touch; the setup and teardown do.')).toBeInTheDocument();
    expect(within(strip('A')).getByText('refused')).toBeInTheDocument();
  });

  test('changing the day, the ground, the event, the From time or the To time takes the red block and the refusal away', async () => {
    const { user } = await openBook();
    const gone = () => {
      expect(screen.queryByText('refused')).not.toBeInTheDocument();
      expect(screen.queryByText('With the buffers, it clashes')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    };
    const refuse = async () => {
      await user.click(screen.getByRole('button', { name: 'Request' }));
      await screen.findByRole('alert');
      expect(within(screen.getByRole('region', { name: 'Ground A' })).getByText('refused')).toBeInTheDocument();
    };
    await askPractice(user);
    await screen.findByRole('alert');
    await user.type(fromBox(), '{Backspace}0');
    gone();
    await refuse();
    await user.type(toBox(), '{Backspace}0');
    gone();
    await refuse();
    await chooseEvent(user, 'Friendly match');
    gone();
    await refuse();
    await user.click(screen.getByRole('button', { name: 'Ground B' }));
    gone();
    await user.click(screen.getByRole('button', { name: 'Ground A' }));
    await refuse();
    await user.clear(screen.getByLabelText(/Day$/));
    await user.type(screen.getByLabelText(/Day$/), '2026-11-07');
    gone();
  });

  test('a slot refused for another reason, a day in the past, draws no red block', async () => {
    const { user } = await openBook();
    await askPractice(user);
    await screen.findByRole('alert');
    expect(within(strip('A')).getByText('refused')).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Day$/));
    await user.type(screen.getByLabelText(/Day$/), '2026-11-02');
    await user.click(screen.getByRole('button', { name: 'Request' }));
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('Nobody books the past.')).toBeInTheDocument();
    expect(screen.queryByText('refused')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('The refused request')).not.toBeInTheDocument();
  });

  test('a screen reader hears the red block as "The refused request", and the refusal is announced', async () => {
    const { user } = await openBook();
    await askPractice(user);
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('With the buffers, it clashes')).toBeInTheDocument();
    expect(within(strip('A')).getByRole('img', { name: 'The refused request' })).toBeInTheDocument();
  });
});
