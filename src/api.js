// PROVIDED: do not edit.
// The only door the screens use to reach GroundBook's backend. Each call returns a Promise of { status, body },
// the same shape a fetch wrapper gives, and the body goes through JSON both ways, just as it would over the wire.
//
// Here the backend runs in the browser (src/backend). To use the real MERN backend instead, keep the two names and
// swap what they do for fetch:
//
//   const API_URL = 'http://localhost:8080';
//   async function call(method, path, body) {
//     const res = await fetch(API_URL + path, {
//       method,
//       headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
//       body: body === undefined ? undefined : JSON.stringify(body),
//     });
//     return { status: res.status, body: await res.json() };
//   }
import { handle } from './backend/routes.js';

const overTheWire = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

async function call(method, path, body) {
  const answer = handle(method, path, overTheWire(body));
  return { status: answer.status, body: overTheWire(answer.body) };
}

const api = {
  get: (path) => call('GET', path),
  post: (path, body) => call('POST', path, body),
};

export default api;
