import { cleanup, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { openApp } from './app.jsx';
import { person } from './given.js';

const menuButton = (name) => screen.getByRole('button', { name: new RegExp(name) });
const back = () => screen.getByRole('link', { name: 'Back to the home page' });
const logo = () => screen.getByRole('link', { name: 'GroundBook home' });
const deepasTabs = () => screen.getByRole('navigation', { name: "Deepa's screens" });

async function openMenu(path = '/clerk/book', who = 'Deepa') {
  const app = await openApp(path);
  const user = person();
  await user.click(menuButton(who));
  return { ...app, user, menu: screen.getByRole('menu') };
}

async function tabTo(user, element, most = 30) {
  for (let i = 0; i < most && document.activeElement !== element; i += 1) await user.tab();
  expect(element).toHaveFocus();
}

describe('F-02 · Moving between people', () => {
  test('on the home page the header has the GroundBook logo with "Deccan Sports Complex" and no back arrow or person menu', async () => {
    await openApp('/');
    expect(within(logo()).getByText('GroundBook')).toBeInTheDocument();
    expect(within(logo()).getByText('Deccan Sports Complex')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to the home page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sabu|Deepa|Anita/ })).not.toBeInTheDocument();
  });

  test("on Deepa's Book the back arrow sits before the logo and the person menu shows D, Deepa and Booking clerk", async () => {
    await openApp('/clerk/book');
    expect(back().compareDocumentPosition(logo()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const button = menuButton('Deepa');
    expect(within(button).getByText('D')).toBeInTheDocument();
    expect(within(button).getByText('Deepa')).toBeInTheDocument();
    expect(within(button).getByText('Booking clerk')).toBeInTheDocument();
  });

  test("on Sabu's and Anita's screens the person menu shows their own initial, name and role", async () => {
    const pages = [
      ['/caretaker/day', 'Sabu', 'Caretaker', 'S'],
      ['/officer/records', 'Anita', 'Municipal officer', 'A'],
    ];
    for (const [path, name, role, initial] of pages) {
      await openApp(path);
      expect(back()).toBeInTheDocument();
      const button = menuButton(name);
      expect(within(button).getByText(name)).toBeInTheDocument();
      expect(within(button).getByText(role)).toBeInTheDocument();
      expect(within(button).getByText(initial)).toBeInTheDocument();
      cleanup();
    }
  });

  test("the back arrow on a person's screen opens the home page", async () => {
    const { address } = await openApp('/clerk/book');
    await person().click(back());
    expect(address()).toBe('/');
  });

  test("the logo on a person's screen opens the home page", async () => {
    const { address } = await openApp('/caretaker/day');
    await person().click(logo());
    expect(address()).toBe('/');
  });

  test('clicking the person menu opens "View the planner as" with Sabu, Deepa and Anita and their roles', async () => {
    const { menu } = await openMenu();
    expect(within(menu).getByText('View the planner as')).toBeInTheDocument();
    const options = within(menu).getAllByRole('menuitem');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveAccessibleName(/Sabu.*Caretaker/);
    expect(options[1]).toHaveAccessibleName(/Deepa.*Booking clerk/);
    expect(options[2]).toHaveAccessibleName(/Anita.*Municipal officer/);
  });

  test('in the open list the ticked person, Deepa on her own Book, is read as the current one, and only her', async () => {
    const { menu } = await openMenu();
    expect(within(menu).getByRole('menuitem', { name: /Deepa/ })).toHaveAttribute('aria-current', 'true');
    expect(within(menu).getByRole('menuitem', { name: /Sabu/ })).not.toHaveAttribute('aria-current');
    expect(within(menu).getByRole('menuitem', { name: /Anita/ })).not.toHaveAttribute('aria-current');
  });

  test("picking Anita on Deepa's Book closes the list, opens /officer/records and shows Anita in the header", async () => {
    const { user, menu, address } = await openMenu();
    await user.click(within(menu).getByRole('menuitem', { name: /Anita/ }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(address()).toBe('/officer/records');
    expect(within(menuButton('Anita')).getByText('Municipal officer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Deepa/ })).not.toBeInTheDocument();
  });

  test('picking Sabu opens The day at /caretaker/day', async () => {
    const { user, menu, address } = await openMenu();
    await user.click(within(menu).getByRole('menuitem', { name: /Sabu/ }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(address()).toBe('/caretaker/day');
    expect(menuButton('Sabu')).toBeInTheDocument();
  });

  test('a click outside the list closes it and you stay where you were', async () => {
    const { user, address } = await openMenu();
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(address()).toBe('/clerk/book');
    expect(menuButton('Deepa')).toBeInTheDocument();
  });

  test('Esc closes the list and you stay where you were', async () => {
    const { user, address } = await openMenu();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(address()).toBe('/clerk/book');
    expect(menuButton('Deepa')).toBeInTheDocument();
  });

  test("on Deepa's Book the tabs Book and Bookings sit in the title row, and Book is the one she is on", async () => {
    await openApp('/clerk/book');
    const tabs = within(deepasTabs()).getAllByRole('link');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAccessibleName('Book');
    expect(tabs[1]).toHaveAccessibleName('Bookings');
    expect(tabs[0]).toHaveAttribute('aria-current', 'page');
    expect(tabs[1]).not.toHaveAttribute('aria-current', 'page');
  });

  test('clicking the Bookings tab opens /clerk/bookings and Bookings is now the one she is on', async () => {
    const { address } = await openApp('/clerk/book');
    await person().click(within(deepasTabs()).getByRole('link', { name: 'Bookings' }));
    expect(address()).toBe('/clerk/bookings');
    expect(within(deepasTabs()).getByRole('link', { name: 'Bookings' })).toHaveAttribute('aria-current', 'page');
    expect(within(deepasTabs()).getByRole('link', { name: 'Book' })).not.toHaveAttribute('aria-current', 'page');
  });

  test("Sabu's The day and Anita's Records have no tabs", async () => {
    for (const [path, who] of [['/caretaker/day', 'Sabu'], ['/officer/records', 'Anita']]) {
      await openApp(path);
      expect(menuButton(who)).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: /screens/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Book' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Bookings' })).not.toBeInTheDocument();
      cleanup();
    }
  });

  test('the address /clerk opens Book and becomes /clerk/book', async () => {
    const { address } = await openApp('/clerk');
    expect(address()).toBe('/clerk/book');
    expect(within(deepasTabs()).getByRole('link', { name: 'Book' })).toHaveAttribute('aria-current', 'page');
  });

  test('/caretaker becomes /caretaker/day and /officer becomes /officer/records', async () => {
    const first = await openApp('/caretaker');
    expect(first.address()).toBe('/caretaker/day');
    expect(menuButton('Sabu')).toBeInTheDocument();
    cleanup();
    const second = await openApp('/officer');
    expect(second.address()).toBe('/officer/records');
    expect(menuButton('Anita')).toBeInTheDocument();
  });

  test('an address the planner does not have, /pitch, opens the home page at /', async () => {
    const { address } = await openApp('/pitch');
    expect(address()).toBe('/');
    expect(screen.getByText('Who are you today?')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to the home page' })).not.toBeInTheDocument();
  });

  test('Tab reaches the back arrow, the logo and the person menu in turn, and Enter opens the menu', async () => {
    await openApp('/clerk/book');
    const user = person();
    await user.tab();
    expect(back()).toHaveFocus();
    await user.tab();
    expect(logo()).toHaveFocus();
    await user.tab();
    expect(menuButton('Deepa')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(within(screen.getByRole('menu')).getByText('View the planner as')).toBeInTheDocument();
  });

  test('in the open menu Tab reaches each person, and Enter on Anita opens Records', async () => {
    const { address } = await openApp('/clerk/book');
    const user = person();
    await tabTo(user, menuButton('Deepa'));
    await user.keyboard('{Enter}');
    const menu = screen.getByRole('menu');
    await user.tab();
    expect(within(menu).getByRole('menuitem', { name: /Sabu/ })).toHaveFocus();
    await user.tab();
    expect(within(menu).getByRole('menuitem', { name: /Deepa/ })).toHaveFocus();
    await user.tab();
    expect(within(menu).getByRole('menuitem', { name: /Anita/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(address()).toBe('/officer/records');
  });

  test('Esc closes the menu and puts the focus back on the person menu', async () => {
    await openApp('/clerk/book');
    const user = person();
    await tabTo(user, menuButton('Deepa'));
    await user.keyboard('{Enter}');
    await user.tab();
    expect(within(screen.getByRole('menu')).getByRole('menuitem', { name: /Sabu/ })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(menuButton('Deepa')).toHaveFocus();
  });
});
