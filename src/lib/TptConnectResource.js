import { fullUrl } from '../helpers';

class TptConnectResource {
  constructor(attributes, oldAttributes, dispatchers) {
    this.attributes = attributes;
    this.definition = this.attributes.definition || {};
    this.oldAttributes = oldAttributes || {};
    this.dispatchers = dispatchers;
    this.updateActions();
  }

  get meta() {
    return {
      ...(this.attributes.meta || this.oldAttributes.meta || {}),
      _isDirty: this.isDirty,
      _timerId: this.timerId
    };
  }

  get timerId() {
    return this.oldAttributes.meta && this.oldAttributes.meta._timerId;
  }

  get value() {
    return this.attributes.value || this.oldAttributes.value || this.definition.defaultValue;
  }

  // used to figure out if we should refetch our resource
  get isDirty() {
    return this.oldAttributes.definition &&
      (this.definition.auto && !this.oldAttributes.definition.auto ||
      this.definition.requestKey !== this.oldAttributes.definition.requestKey);
  }

  updateActions() {
    const { actions = {} } = this.definition;
    return Object.keys(actions).forEach((actionKey) => {
      const action = typeof actions[actionKey] === 'function'
        ? actions[actionKey]
        : () => actions[actionKey];

      this[actionKey] = (...args) => {
        const actionDefinition = {
          ...this.definition,
          updateStrategy: false,
          refetchAfter: false,
          ...action(...args)
        };
        const { refetchAfter } = actionDefinition;
        const url = fullUrl(actionDefinition.url, actionDefinition.params);
        return this.dispatchers.dispatchRequest({ ...actionDefinition, url })
          .then((response) => {
            if (refetchAfter === 'success' || refetchAfter === true) { this.fetch(); }
            return response;
          }).catch((err) => {
            if (refetchAfter === 'error' || refetchAfter === true) { this.fetch(); }
            return err;
          });
      };
    });
  }

  invalidate() {
    return this.dispatchers.invalidateResource(this.definition);
  }

  prepopulate() {
    return this.dispatchers.prepopulateResource(this.definition);
  }

  fetch() {
    return this.dispatchers.dispatchRequest(this.definition);
  }
}

export default TptConnectResource;
