import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, clockAt, person } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const dayBox = () => screen.getByLabelText(/Day$/);
const fromBox = () => screen.getByRole('textbox', { name: 'From' });
const toBox = () => screen.getByRole('textbox', { name: 'To' });
const clubBox = () => screen.getByLabelText(/Club$/);
const groundButton = (g) => screen.getByRole('button', { name: `Ground ${g}` });
const eventButton = () => screen.getByRole('button', { name: /^Event type/ });
const requestButton = () => screen.getByRole('button', { name: 'Request' });
const TIMES_HELP = 'The match itself, 24-hour (14:00). The setup and teardown are added from the event type.';
const CLUB_HELP = 'Kept on the booking; never in its record.';

async function openBook(path = '/clerk/book') {
  clockAt(TUE_1343);
  const app = await openApp(path);
  await screen.findByRole('button', { name: 'Ground A' });
  await within(eventButton()).findByText('League match');
  return { ...app, user: person() };
}

async function typeIn(user, box, text) {
  await user.clear(box);
  if (text) await user.type(box, text);
}

async function pickDay(user, date) {
  await user.clear(dayBox());
  await user.type(dayBox(), date);
}

describe('F-05 · A club asks for a slot', () => {
  test('Book opens titled "Book" under "Deccan Sports Complex · Saturday 7 November", filled in with a sensible slot', async () => {
    await openBook();
    expect(screen.getByRole('heading', { level: 1, name: 'Book' })).toBeInTheDocument();
    expect(screen.getByText('Deccan Sports Complex · Saturday 7 November')).toBeInTheDocument();
    expect(dayBox()).toHaveValue('2026-11-07');
    expect(groundButton('A')).toHaveAttribute('aria-pressed', 'true');
    for (const g of ['B', 'C', 'D']) expect(groundButton(g)).toHaveAttribute('aria-pressed', 'false');
    expect(within(eventButton()).getByText('League match')).toBeInTheDocument();
    expect(fromBox()).toHaveValue('14:00');
    expect(toBox()).toHaveValue('17:00');
    expect(clubBox()).toHaveValue('Deccan Gymkhana');
  });

  test('the form has four numbered steps, Day, Ground and event, From and to, Club, and a Request button', async () => {
    await openBook();
    expect(screen.getByText(reading('1', 'Day'))).toBeInTheDocument();
    expect(screen.getByText(reading('2', 'Ground and event'))).toBeInTheDocument();
    expect(screen.getByText(reading('3', 'From and to'))).toBeInTheDocument();
    expect(screen.getByText(reading('4', 'Club'))).toBeInTheDocument();
    expect(requestButton()).toBeInTheDocument();
  });

  test('the help lines under the times and under the club say what goes in them', async () => {
    await openBook();
    expect(screen.getByText(TIMES_HELP)).toBeInTheDocument();
    expect(screen.getByText(CLUB_HELP)).toBeInTheDocument();
  });

  test('before anything is sent the panel says "Request a slot" and how the ground is held', async () => {
    await openBook();
    expect(screen.getByText('Request a slot')).toBeInTheDocument();
    expect(screen.getByText('The ground is held with its setup before and its teardown after, for as long as the hold lasts.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('picking Saturday 14 November in the Day box changes the line above the title', async () => {
    const { user } = await openBook();
    await pickDay(user, '2026-11-14');
    expect(dayBox()).toHaveValue('2026-11-14');
    expect(screen.getByText('Deccan Sports Complex · Saturday 14 November')).toBeInTheDocument();
    expect(screen.queryByText('Deccan Sports Complex · Saturday 7 November')).not.toBeInTheDocument();
  });

  test('the address /clerk/book?date=2026-11-14 starts the Day box on 14 November', async () => {
    await openBook('/clerk/book?date=2026-11-14');
    expect(dayBox()).toHaveValue('2026-11-14');
    expect(screen.getByText('Deccan Sports Complex · Saturday 14 November')).toBeInTheDocument();
  });

  test('clicking "Ground C" presses Ground C and lets go of Ground A', async () => {
    const { user } = await openBook();
    await user.click(groundButton('C'));
    expect(groundButton('C')).toHaveAttribute('aria-pressed', 'true');
    expect(groundButton('A')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the event-type drop-down lists the six types with their minutes, League match ticked, and a pick closes it', async () => {
    const { user } = await openBook();
    await user.click(eventButton());
    const list = screen.getByRole('listbox');
    const options = within(list).getAllByRole('option');
    expect(options).toHaveLength(6);
    const types = [
      ['Practice', '20 min before · 20 after'],
      ['Friendly match', '30 min before · 20 after'],
      ['League match', '40 min before · 30 after'],
      ['Athletics meet', '60 min before · 45 after'],
      ['Tournament', '90 min before · 60 after'],
      ['School sports day', '120 min before · 120 after'],
    ];
    types.forEach(([name, minutes], i) => {
      expect(within(options[i]).getByText(name)).toBeInTheDocument();
      expect(within(options[i]).getByText(minutes)).toBeInTheDocument();
    });
    expect(within(list).getByRole('option', { name: /League match/ })).toHaveAttribute('aria-selected', 'true');
    expect(within(list).getByRole('option', { name: /Practice/ })).toHaveAttribute('aria-selected', 'false');
    await user.click(within(list).getByRole('option', { name: /Practice/ }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(within(eventButton()).getByText('Practice')).toBeInTheDocument();
  });

  test('a click outside the open list closes it and the choice stays League match', async () => {
    const { user } = await openBook();
    await user.click(eventButton());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('heading', { level: 1, name: 'Book' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(within(eventButton()).getByText('League match')).toBeInTheDocument();
  });

  test('Esc closes the open list and the choice stays League match', async () => {
    const { user } = await openBook();
    await user.click(eventButton());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(within(eventButton()).getByText('League match')).toBeInTheDocument();
  });

  test('Request with From empty says "Type the time it starts, like 14:00." under the times and in the panel', async () => {
    const { user } = await openBook();
    await typeIn(user, fromBox(), '');
    await user.click(requestButton());
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('Something in the form is not right')).toBeInTheDocument();
    expect(within(panel).getByText('Type the time it starts, like 14:00.')).toBeInTheDocument();
    expect(screen.getAllByText('Type the time it starts, like 14:00.')).toHaveLength(2);
    expect(screen.queryByText(TIMES_HELP)).not.toBeInTheDocument();
    expect(screen.queryByText('Request a slot')).not.toBeInTheDocument();
    expect(fromBox()).toBeInvalid();
    expect(toBox()).not.toBeInvalid();
    expect(clubBox()).not.toBeInvalid();
  });

  test('Request with 2pm in From says "Write the start time in 24-hour form, like 09:00 or 14:00."', async () => {
    const { user } = await openBook();
    await typeIn(user, fromBox(), '2pm');
    await user.click(requestButton());
    await screen.findByRole('alert');
    expect(screen.getAllByText('Write the start time in 24-hour form, like 09:00 or 14:00.')).toHaveLength(2);
    expect(screen.queryByText(TIMES_HELP)).not.toBeInTheDocument();
  });

  test('Request with From 14:00 and To 14:20 says "An interval lasts from 30 minutes to 12 hours."', async () => {
    const { user } = await openBook();
    await typeIn(user, toBox(), '14:20');
    await user.click(requestButton());
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('Something in the form is not right')).toBeInTheDocument();
    expect(screen.getAllByText('An interval lasts from 30 minutes to 12 hours.')).toHaveLength(2);
    expect(screen.queryByText(TIMES_HELP)).not.toBeInTheDocument();
    expect(toBox()).toBeInvalid();
    expect(fromBox()).not.toBeInvalid();
  });

  test('Request with the Club box empty says "Type the club’s name." under the club', async () => {
    const { user } = await openBook();
    await typeIn(user, clubBox(), '');
    await user.click(requestButton());
    await screen.findByRole('alert');
    expect(screen.getAllByText('Type the club’s name.')).toHaveLength(2);
    expect(screen.queryByText(CLUB_HELP)).not.toBeInTheDocument();
    expect(screen.getByText(TIMES_HELP)).toBeInTheDocument();
    expect(clubBox()).toBeInvalid();
    expect(fromBox()).not.toBeInvalid();
  });

  test('From 17:00 to 14:00 is refused: "That slot cannot be booked", "The interval must end after it starts."', async () => {
    const { user } = await openBook();
    await typeIn(user, fromBox(), '17:00');
    await typeIn(user, toBox(), '14:00');
    await user.click(requestButton());
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('That slot cannot be booked')).toBeInTheDocument();
    expect(within(panel).getByText('The interval must end after it starts.')).toBeInTheDocument();
  });

  test('a League match 06:20–08:00 on a Saturday is refused with the ground\'s hours, 06:00–22:00', async () => {
    const { user } = await openBook();
    await typeIn(user, fromBox(), '06:20');
    await typeIn(user, toBox(), '08:00');
    await user.click(requestButton());
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('That slot cannot be booked')).toBeInTheDocument();
    expect(within(panel).getByText('With setup and teardown, the ground would be held outside its hours: it is open 06:00–22:00 that day.')).toBeInTheDocument();
  });

  test('a day that has already gone is refused: "Nobody books the past."', async () => {
    const { user } = await openBook();
    await pickDay(user, '2026-11-02');
    await user.click(requestButton());
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('That slot cannot be booked')).toBeInTheDocument();
    expect(within(panel).getByText('Nobody books the past.')).toBeInTheDocument();
  });

  test('changing the day, the ground, the event, a time or the club clears the red words and brings back "Request a slot"', async () => {
    const { user } = await openBook();
    const refuse = async () => {
      await typeIn(user, clubBox(), '');
      await user.click(requestButton());
      await screen.findByRole('alert');
      expect(screen.queryByText('Request a slot')).not.toBeInTheDocument();
    };
    const cleared = () => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Request a slot')).toBeInTheDocument();
    };
    await refuse();
    await user.type(clubBox(), 'D');
    cleared();
    expect(screen.getByText(CLUB_HELP)).toBeInTheDocument();
    await refuse();
    await user.click(groundButton('B'));
    cleared();
    await refuse();
    await user.click(eventButton());
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: /Practice/ }));
    cleared();
    await refuse();
    await user.type(fromBox(), '{Backspace}');
    cleared();
    await refuse();
    await user.type(toBox(), '{Backspace}');
    cleared();
    await refuse();
    await pickDay(user, '2026-11-14');
    cleared();
  });

  test('before the grounds and event types arrive there are no ground buttons and the drop-down says "Choose…"', async () => {
    clockAt(TUE_1343);
    await openApp('/clerk/book');
    expect(screen.queryByRole('button', { name: /^Ground [A-D]$/ })).not.toBeInTheDocument();
    expect(within(eventButton()).getByText('Choose…')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Ground A' })).toBeInTheDocument();
    expect(await within(eventButton()).findByText('League match')).toBeInTheDocument();
  });

  test('Tab goes through the Day box, the ground buttons, the drop-down, From, To and Club in order, and Enter sends', async () => {
    const { user } = await openBook();
    await typeIn(user, clubBox(), '');
    for (let i = 0; i < 30 && document.activeElement !== dayBox(); i += 1) await user.tab();
    expect(dayBox()).toHaveFocus();
    for (const next of [groundButton('A'), groundButton('B'), groundButton('C'), groundButton('D'), eventButton(), fromBox(), toBox(), clubBox()]) {
      await user.tab();
      expect(next).toHaveFocus();
    }
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getAllByText('Type the club’s name.')).toHaveLength(2);
  });

  test('Enter in the From box sends the form, as Request does', async () => {
    const { user } = await openBook();
    await typeIn(user, fromBox(), '17:00');
    await typeIn(user, toBox(), '14:00');
    await user.click(fromBox());
    await user.keyboard('{Enter}');
    const panel = await screen.findByRole('alert');
    expect(within(panel).getByText('The interval must end after it starts.')).toBeInTheDocument();
  });

  test('on the drop-down, Down opens it, Up moves, Enter picks; Enter or Space opens it and Esc closes it', async () => {
    const { user } = await openBook();
    for (let i = 0; i < 30 && document.activeElement !== eventButton(); i += 1) await user.tab();
    expect(eventButton()).toHaveFocus();
    expect(eventButton()).toHaveAccessibleName('Event type: League match');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(within(eventButton()).getByText('Friendly match')).toBeInTheDocument();
    expect(eventButton()).toHaveAccessibleName('Event type: Friendly match');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(within(eventButton()).getByText('Friendly match')).toBeInTheDocument();
    await user.keyboard(' ');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('with the Day box empty the line above the title names only the place, and Request says "Pick a day." under the box and in the panel', async () => {
    const { user } = await openBook();
    await user.clear(dayBox());
    expect(screen.queryByText(/^Deccan Sports Complex · /)).not.toBeInTheDocument();
    expect(screen.getAllByText('Deccan Sports Complex')).toHaveLength(2);
    await user.click(requestButton());
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((a) => within(a).queryByText('Something in the form is not right') && within(a).queryByText('Pick a day.'))).toBe(true);
    const step2 = screen.getByText(reading('2', 'Ground and event'));
    const underTheBox = screen.getAllByText('Pick a day.').filter((p) => (dayBox().compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)
      && (p.compareDocumentPosition(step2) & Node.DOCUMENT_POSITION_FOLLOWING));
    expect(underTheBox).toHaveLength(1);
    expect(dayBox()).toBeInvalid();
    expect(screen.getByText(TIMES_HELP)).toBeInTheDocument();
    expect(screen.queryByText('Type the time it starts, like 14:00.')).not.toBeInTheDocument();
    expect(screen.queryByText('Write the start time in 24-hour form, like 09:00 or 14:00.')).not.toBeInTheDocument();
    expect(fromBox()).not.toBeInvalid();
  });
});
