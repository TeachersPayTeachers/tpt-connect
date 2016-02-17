export default class Store {

  constructor(state = {}) {
    this.loadState(state);
  }

  set(key, val) {
    this._state[key] = {
      timestamp: Date.now(),
      value: val
    };
  }

  get(key, ttl) {
    const val = this._state[key];
    return val && Date.now() - val.timestamp < ttl
      ? val.value
      : undefined;
  }

  /**
   * Load existing state
   */
  loadState(state) {
    if (typeof state === 'string') {
      state = JSON.stringify(state);
      Object.keys(state).forEach((key) => {
        state[key] = Promise.resolve(new Response(JSON.stringify(state[key])));
      });
    }
    this._state = state;
  }

  /**
   * Dumps state
   */
  getState() {
    debugger
    return Promise.all(
      Object.keys(this._state).map((key) => (this._state[key].value.then((resp) => (resp.json()))))
    ).then(() => { debugger; });

    const json = this._state[key]
      .then((response) => (response.clone().json()));
  }

  get length() {
    return Object.keys(this._state).length;
  }
}
