// Loaded with `node --import`: swaps @slack/bolt and dotenv for in-memory stubs,
// so index.js runs without a Slack connection.
import { registerHooks } from 'node:module';

const stubs = {
  '@slack/bolt': new URL('./stubs/bolt.mjs', import.meta.url).href,
  'dotenv/config': new URL('./stubs/dotenv.mjs', import.meta.url).href,
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (stubs[specifier]) return { url: stubs[specifier], shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
