export default class Cache {
  constructor(store) {
    this.store = store;
  }

  set(key, val) {
    this.store[key] = {
      timestamp: new Date,
      value: val
    };
  }

  get(key, ttl) {
    const val = this.store[key];
    return val && new Date - val.timestamp < ttl
      ? val.value
      : undefined;
  }
}
