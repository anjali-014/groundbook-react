import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api.js';
import { VENUE } from '../data/complex.js';

// Every screen reads the planner through these hooks. After any change (a request, a confirm, a cancel, a move) the
// screens on show ask for their data again, as a real frontend refetches after a POST.
// on show ask for their data again, as a real frontend refetches after a POST.
const DataVersion = createContext(null);

/** Holds the number that goes up after every change, so the screens know to read again. */
export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);
  return <DataVersion.Provider value={{ version, changed: () => setVersion((v) => v + 1) }}>{children}</DataVersion.Provider>;
}

/** 
 * The answers to GETs of these paths, in the same order, read again after every change. Until the first answers
 * arrive it gives null; afterwards it keeps showing the last answers while it asks again.
 */
export function useGetEach(paths) {
  const { version } = useContext(DataVersion);
  const [answers, setAnswers] = useState(null);
  const key = paths.join(' ');
  useEffect(() => {
    let current = true;
    Promise.all(key.split(' ').filter(Boolean).map((path) => api.get(path))).then((all) => {
      if (current) setAnswers(all);
    });
    return () => { current = false; };
  }, [key, version]);
  return answers;
}

/** The answer to a GET of this path ({ status, body }), or null until it arrives. */
export function useGet(path) {
  return useGetEach([path])?.[0] ?? null;
}

/** The event types' names by code, e.g. { league: 'League match' }, or null until they arrive. */
export function useEventNames() {
  const answer = useGet(`/venues/${VENUE.slug}/event-types`);
  if (!answer) return null;
  return Object.fromEntries((answer.status === 200 ? answer.body.eventTypes : []).map((t) => [t.code, t.name]));
}

/** A function that POSTs and gives the answer; when something changed, every screen on show reads again. */
export function usePost() {
  const { changed } = useContext(DataVersion);
  return async (path, body) => {
    const answer = await api.post(path, body);
    if (answer.status < 300) changed();
    return answer;
  };
}
