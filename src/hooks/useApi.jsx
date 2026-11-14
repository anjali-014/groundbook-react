import { createContext, useEffect, useState } from 'react';
import api from '../api.js';

// Every screen reads the planner through this hook.
const DataVersion = createContext(null);

export function DataProvider({ children }) {
  return <DataVersion.Provider value={null}>{children}</DataVersion.Provider>;
}

/**
 * The answer to a GET of this path ({ status, body }), or null until it arrives; when the path changes it keeps
 * showing the last answer while it asks again.
 */
export function useGet(path) {
  const [answer, setAnswer] = useState(null);
  useEffect(() => {
    let current = true;
        api.get(path).then((got) => {
      if (current) setAnswer(got);
    });
        return () => { current = false; };
  }, [path]);
  return answer;
}