import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { openApp } from './app.jsx';
import { TUE_1343, book, cancel, clockAt, person } from './given.js';
import { reading } from './look.js';

afterEach(() => vi.useRealTimers());

const cardOf = (name) => screen.getByRole('link', { name: new RegExp(`Continue as ${name}`) });

describe('F-01 · The front door', () => {
  test('the home page says "Deccan Sports Complex · the planner" over the heading "Four grounds." / "No pencil on the wall."', async () => {
    await openApp('/');
    expect(screen.getByText('Deccan Sports Complex · the planner')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(within(heading).getByText('Four grounds.')).toBeInTheDocument();
    expect(within(heading).getByText('No pencil on the wall.')).toBeInTheDocument();
  });

  test('once the numbers are in, the counts read 4 grounds, 6 event types and 1 held next Saturday on A', async () => {
    clockAt(TUE_1343);
    await openApp('/', { before: async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); } });
    await screen.findByText('BK0001');
    expect(await screen.findByText(reading('1', 'held next Saturday on A'))).toBeInTheDocument();
    expect(screen.getByText(reading('4', 'grounds'))).toBeInTheDocument();
    expect(screen.getByText(reading('6', 'event types'))).toBeInTheDocument();
  });

  test("with nothing booked, once Ground A's day is in, held next Saturday on A is 0", async () => {
    clockAt(TUE_1343);
    await openApp('/');
    await screen.findAllByText(/06:00/);
    expect(screen.getByText(reading('0', 'held next Saturday on A'))).toBeInTheDocument();
    expect(screen.getByText(reading('4', 'grounds'))).toBeInTheDocument();
  });

  test('two bookings on Ground A next Saturday, one of them cancelled, count as 1 held', async () => {
    clockAt(TUE_1343);
    await openApp('/', {
      before: async (api) => {
        await book(api, 'A', 'League match', '14:00', '17:00');
        const second = await book(api, 'A', 'Practice', '18:00', '19:00');
        await cancel(api, second.bookingId);
      },
    });
    expect(await screen.findByText(reading('1', 'held next Saturday on A'))).toBeInTheDocument();
  });

  test('before the numbers arrive the counts already read 4, 6 and 0, and the picture comes once the day is in', async () => {
    clockAt(TUE_1343);
    await openApp('/', { before: async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); } });
    expect(screen.getByText(reading('4', 'grounds'))).toBeInTheDocument();
    expect(screen.getByText(reading('6', 'event types'))).toBeInTheDocument();
    expect(screen.getByText(reading('0', 'held next Saturday on A'))).toBeInTheDocument();
    expect(screen.queryByText('BK0001')).not.toBeInTheDocument();
    expect(await screen.findByText('BK0001')).toBeInTheDocument();
    expect(screen.getByText(reading('1', 'held next Saturday on A'))).toBeInTheDocument();
  });

  test("the picture shows Ground A's hours and a block with each booking's number", async () => {
    clockAt(TUE_1343);
    await openApp('/', {
      before: async (api) => {
        await book(api, 'A', 'League match', '14:00', '17:00');
        await book(api, 'A', 'Practice', '08:00', '09:00');
      },
    });
    expect(await screen.findByText('BK0001')).toBeInTheDocument();
    expect(screen.getByText('BK0002')).toBeInTheDocument();
    expect(screen.getAllByText(/06:00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/22:00/).length).toBeGreaterThan(0);
  });

  test('the picture is only a picture: nothing in it is a button or a link, and clicking a block does nothing', async () => {
    clockAt(TUE_1343);
    const { address } = await openApp('/', { before: async (api) => { await book(api, 'A', 'League match', '14:00', '17:00'); } });
    const block = await screen.findByText('BK0001');
    expect(screen.queryByRole('button', { name: /BK0001/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /BK0001/ })).not.toBeInTheDocument();
    await person().click(block);
    expect(address()).toBe('/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('under "Who are you today?" there is one card each for Sabu, Deepa and Anita', async () => {
    await openApp('/');
    expect(screen.getByText('Who are you today?')).toBeInTheDocument();
    expect(screen.getByText('Each person sees their own screens. Everything they do changes the same planner.')).toBeInTheDocument();
    const cards = [
      ['Sabu', 'Caretaker', 'Looks after the four grounds. Reads each ground’s day: the bookings and the setup and teardown around them.', 'S'],
      ['Deepa', 'Booking clerk', 'Takes the clubs’ calls. Requests slots, confirms them, cancels them and moves them.', 'D'],
      ['Anita', 'Municipal officer', 'Answers for the complex. Reads every booking’s record.', 'A'],
    ];
    expect(screen.getAllByRole('link', { name: /Continue as/ })).toHaveLength(3);
    for (const [name, role, line, initial] of cards) {
      const card = cardOf(name);
      expect(within(card).getByText(name)).toBeInTheDocument();
      expect(within(card).getByText(role)).toBeInTheDocument();
      expect(within(card).getByText(line)).toBeInTheDocument();
      expect(within(card).getByText(initial)).toBeInTheDocument();
      expect(within(card).getByText(`Continue as ${name}`)).toBeInTheDocument();
    }
  });

  test("clicking Sabu's card opens The day at /caretaker/day", async () => {
    const { address } = await openApp('/');
    await person().click(cardOf('Sabu'));
    expect(address()).toBe('/caretaker/day');
  });

  test("clicking Deepa's card opens Book at /clerk/book", async () => {
    const { address } = await openApp('/');
    await person().click(cardOf('Deepa'));
    expect(address()).toBe('/clerk/book');
  });

  test("clicking Anita's card opens Records at /officer/records", async () => {
    const { address } = await openApp('/');
    await person().click(cardOf('Anita'));
    expect(address()).toBe('/officer/records');
  });

  test("Tab reaches each card, and Enter on Anita's card opens /officer/records", async () => {
    const { address } = await openApp('/');
    const user = person();
    const reached = [];
    for (let i = 0; i < 20 && document.activeElement !== cardOf('Anita'); i += 1) {
      await user.tab();
      reached.push(document.activeElement);
    }
    expect(reached).toContain(cardOf('Sabu'));
    expect(reached).toContain(cardOf('Deepa'));
    expect(cardOf('Anita')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(address()).toBe('/officer/records');
  });

  test("Enter on Sabu's card, reached with Tab, opens /caretaker/day", async () => {
    const { address } = await openApp('/');
    const user = person();
    for (let i = 0; i < 20 && document.activeElement !== cardOf('Sabu'); i += 1) await user.tab();
    expect(cardOf('Sabu')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(address()).toBe('/caretaker/day');
  });
});
