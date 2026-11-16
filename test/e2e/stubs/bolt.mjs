// Records the handlers index.js registers; the test calls them directly.
export class App {
  constructor() {
    this.h = { event: {}, action: {}, view: {} };
    this.client = globalThis.__client;
    globalThis.__app = this;
  }
  event(name, fn) {
    this.h.event[name] = fn;
  }
  action(name, fn) {
    this.h.action[name] = fn;
  }
  view(name, fn) {
    this.h.view[name] = fn;
  }
  async start() {}
  async stop() {}
}
export default { App };
