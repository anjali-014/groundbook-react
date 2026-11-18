import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, clockAt, person, wait } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const CARD = 'Booking BK0001, League match, 14:00 to 17:00. Pencil it on Ground A';
const card = () => screen.getByRole('button', { name: CARD });
const strip = (ground) => screen.getByRole('region', { name: `Ground ${ground}` });
const requestButton = () => screen.getByRole('button', { name: 'Request' });
const fromBox = () => screen.getByRole('textbox', { name: 'From' });
const toBox = () => screen.getByRole('textbox', { name: 'To' });
const HOLD_LINE = 'The match plus its setup and teardown. Confirm it by Wednesday 4 November, 13:43, or the hold lapses.';

async function openBook(path = '/clerk/book', before) {
  clockAt(TUE_1343);
  const app = await openApp(path, { before });
  await screen.findByRole('button', { name: 'Ground A' });
  await within(screen.getByRole('button', { name: /^Event type/ })).findByText('League match');
  await screen.findByRole('region', { name: 'Ground A' });
  return { ...app, user: person() };
}

/** Presses Request with the form as it is and waits for the booking card to pencil in. */
async function requestIt(user) {
  await user.click(requestButton());
  return screen.findByRole('button', { name: CARD });
}

/** Taps the card into its slot and lets the hold spread. */
async function pencilIn(user) {
  await user.click(card());
  await wait(1200);
  return screen.findByRole('button', { name: 'OK, next request' });
}

describe('F-06 · Pencilling it in', () => {
  test('under the form "Ground A that day" shows Ground A\'s strip for the day in the Day box', async () => {
    await openBook('/clerk/book', async (api) => { await book(api, 'A', 'Practice', '09:00', '10:00'); });
    expect(screen.getByRole('heading', { name: 'Ground A that day' })).toBeInTheDocument();
    expect(await within(strip('A')).findByText('BK0001')).toBeInTheDocument();
    expect(within(strip('A')).getByText(reading('06:00–22:00 · 1 held'))).toBeInTheDocument();
  });

  test('picking Ground B makes it "Ground B that day" with Ground B\'s strip', async () => {
    const { user } = await openBook('/clerk/book', async (api) => { await book(api, 'B', 'Practice', '09:00', '10:00'); });
    await user.click(screen.getByRole('button', { name: 'Ground B' }));
    expect(screen.getByRole('heading', { name: 'Ground B that day' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ground A that day' })).not.toBeInTheDocument();
    expect(await within(await screen.findByRole('region', { name: 'Ground B' })).findByText('BK0001')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ground A' })).not.toBeInTheDocument();
  });

  test('picking another day in the Day box shows Ground A\'s strip for that day', async () => {
    const { user } = await openBook('/clerk/book', async (api) => {
      await book(api, 'A', 'Practice', '09:00', '10:00', { date: '2026-11-14' });
    });
    expect(within(strip('A')).queryByText('BK0001')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Day$/));
    await user.type(screen.getByLabelText(/Day$/), '2026-11-14');
    expect(await within(strip('A')).findByText('BK0001')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ground A that day' })).toBeInTheDocument();
  });

  test('an accepted slot turns the panel into the two steps, the bar for the day and the booking card', async () => {
    const { user } = await openBook();
    const theCard = await requestIt(user);
    expect(screen.getByText(reading('1', 'Pencil it on Ground A'))).toBeInTheDocument();
    expect(screen.getByText(reading('2', 'Ground held'))).toBeInTheDocument();
    expect(screen.getByText('Ground A · Saturday 7 November')).toBeInTheDocument();
    expect(within(theCard).getByText('BK0001')).toBeInTheDocument();
    expect(within(theCard).getByText('League match · 14:00–17:00')).toBeInTheDocument();
    expect(within(theCard).getByText('Deccan Gymkhana')).toBeInTheDocument();
    expect(screen.queryByText('Request a slot')).not.toBeInTheDocument();
  });

  test('the first step\'s caption says "Drag BK0001 onto its slot" and "Or tap the booking. The dashed box is 14:00–17:00."', async () => {
    const { user } = await openBook();
    await requestIt(user);
    expect(screen.getByText(reading('Drag BK0001 onto its slot'))).toBeInTheDocument();
    expect(screen.getByText('Or tap the booking. The dashed box is 14:00–17:00.')).toBeInTheDocument();
  });

  test('as soon as the slot is accepted BK0001 is on "Ground A that day" and its head says 1 held', async () => {
    const { user } = await openBook();
    expect(within(strip('A')).getByText(reading('06:00–22:00 · 0 held'))).toBeInTheDocument();
    await requestIt(user);
    expect(await within(strip('A')).findByText('BK0001')).toBeInTheDocument();
    expect(within(strip('A')).getByText(reading('06:00–22:00 · 1 held'))).toBeInTheDocument();
    expect(card()).toBeInTheDocument();
  });

  test('while the first step is showing every box, button and the drop-down of the form is locked', async () => {
    const { user } = await openBook();
    await requestIt(user);
    expect(screen.getByLabelText(/Day$/)).toBeDisabled();
    for (const g of ['A', 'B', 'C', 'D']) expect(screen.getByRole('button', { name: `Ground ${g}` })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Event type/ })).toBeDisabled();
    expect(fromBox()).toBeDisabled();
    expect(toBox()).toBeDisabled();
    expect(screen.getByLabelText(/Club$/)).toBeDisabled();
    expect(requestButton()).toBeDisabled();
  });

  test('tapping or clicking the card puts BK0001 in its slot and the card is gone', async () => {
    const { user } = await openBook();
    await requestIt(user);
    await user.click(card());
    expect(screen.queryByRole('button', { name: CARD })).not.toBeInTheDocument();
    expect(screen.queryByText(reading('Drag BK0001 onto its slot'))).not.toBeInTheDocument();
    expect(within(strip('A')).getByText('BK0001')).toBeInTheDocument();
    expect(screen.getAllByText('BK0001')).toHaveLength(2);
  });

  test('the next moment the caption says "Holding the ground…" and step 1 is ticked', async () => {
    const { user } = await openBook();
    await requestIt(user);
    await user.click(card());
    expect(screen.getByText('Holding the ground…')).toBeInTheDocument();
    expect(screen.getByText(reading('Pencil it on Ground A'))).toBeInTheDocument();
    expect(screen.queryByText(reading('1', 'Pencil it on Ground A'))).not.toBeInTheDocument();
    expect(screen.getByText(reading('2', 'Ground held'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'OK, next request' })).not.toBeInTheDocument();
  });

  test('about a second later it says "Ground A is held 13:20–17:30", until when to confirm, and shows "OK, next request"', async () => {
    const { user } = await openBook();
    await requestIt(user);
    await user.click(card());
    expect(screen.queryByText('Ground A is held 13:20–17:30')).not.toBeInTheDocument();
    await wait(1200);
    // the hold spreads about a second after the card goes in: well before three seconds have passed
    expect(await screen.findByText('Ground A is held 13:20–17:30', {}, { timeout: 1500 })).toBeInTheDocument();
    expect(screen.getByText(reading(HOLD_LINE))).toBeInTheDocument();
    expect(screen.queryByText(reading('2', 'Ground held'))).not.toBeInTheDocument();
    expect(screen.getByText(reading('Ground held'))).toBeInTheDocument();
    expect(screen.queryByText('Holding the ground…')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK, next request' })).toBeInTheDocument();
  });

  test('"OK, next request" brings back "Request a slot" and unlocks the form, still holding what she typed', async () => {
    const { user } = await openBook();
    await user.click(screen.getByRole('button', { name: 'Ground B' }));
    await user.click(screen.getByRole('button', { name: /^Event type/ }));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: /Practice/ }));
    await user.clear(fromBox());
    await user.type(fromBox(), '09:00');
    await user.clear(toBox());
    await user.type(toBox(), '10:00');
    await user.click(requestButton());
    await user.click(await screen.findByRole('button', { name: /^Booking BK0001, Practice, 09:00 to 10:00\. Pencil it on Ground B$/ }));
    await wait(1200);
    await user.click(await screen.findByRole('button', { name: 'OK, next request' }));
    expect(screen.getByText('Request a slot')).toBeInTheDocument();
    expect(fromBox()).toBeEnabled();
    expect(fromBox()).toHaveValue('09:00');
    expect(toBox()).toHaveValue('10:00');
    expect(screen.getByRole('button', { name: 'Ground B' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(screen.getByRole('button', { name: /^Event type/ })).getByText('Practice')).toBeInTheDocument();
    expect(screen.getByLabelText(/Club$/)).toHaveValue('Deccan Gymkhana');
    expect(requestButton()).toBeEnabled();
  });

  test('by keyboard: Tab to the card and Enter puts it in its slot, then "OK, next request" has the focus', async () => {
    const { user } = await openBook();
    await requestIt(user);
    for (let i = 0; i < 30 && document.activeElement !== card(); i += 1) await user.tab();
    expect(card()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Holding the ground…')).toBeInTheDocument();
    await wait(1200);
    const ok = await screen.findByRole('button', { name: 'OK, next request' });
    expect(ok).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Request a slot')).toBeInTheDocument();
  });

  test('on a phone a finger tap on the card puts it in its slot as a drag does', async () => {
    const { user } = await openBook();
    await requestIt(user);
    await user.pointer({ keys: '[TouchA]', target: card() });
    expect(screen.queryByRole('button', { name: CARD })).not.toBeInTheDocument();
    expect(screen.getByText('Holding the ground…')).toBeInTheDocument();
  });
});
