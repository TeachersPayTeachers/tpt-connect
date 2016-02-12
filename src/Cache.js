export default class Cache {

  constructor(store = {}) {
    this._store = store;
  }

  set(key, val) {
    this._store[key] = {
      timestamp: new Date,
      value: val
    };
  }

  get(key, ttl) {
    const val = this._store[key];
    return val && new Date - val.timestamp < ttl
      ? val.value
      : undefined;
  }

  clear() {
    this._store = {};
  }

  get length() {
    return Object.keys(this._store).length;
  }
}
