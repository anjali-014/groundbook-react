// Opens the whole app at one address, on a fresh planner, the way a person would land on it.
// Every call starts from the starting data again: the app's modules are loaded anew, so nothing a previous test did
// is still booked. `before(api)` can put the planner into a state first (requests, confirmations, cancellations,
// moves), through the same api the screens use. `address()` reads the address bar: the path and the ?query the app
// is on right now.
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

function AddressBar({ onChange }) {
  const location = useLocation();
  onChange(location.pathname + location.search);
  return null;
}

export async function openApp(path = '/', { before } = {}) {
  vi.resetModules();
  const { default: api } = await import('../src/api.js');
  if (before) await before(api);
  const { default: App } = await import('../src/App.jsx');
  const { DataProvider } = await import('../src/hooks/useApi.jsx');
  let current = path;
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <AddressBar onChange={(where) => { current = where; }} />
      <DataProvider>
        <App />
      </DataProvider>
    </MemoryRouter>,
  );
  return { ...view, api, address: () => current };
}
