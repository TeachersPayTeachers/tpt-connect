/**
 * TptConnect adds the following attributes to each mapping:
 * - ttl - for how long should the mapping be stored. If not provided, no caching will be used.
 * - type - will validate we get the correct type or else reject the promise.
 *   also used to set default value if missing
 * - default - default value to populate the `value` property of the promise with
 */

import { PropTypes } from 'react';
import normalizeUrl from 'normalize-url';
import { connect as refetchConnect } from 'react-refetch';
import crypto from 'crypto';

/**
 * Generates store key based on the `comparison` string provided or the
 * request's URL and headers.
 */
function _storeKey(mapping) {
  return mapping.comparison || (mapping.comparison =
    Object.keys(mapping.headers)
      .sort()
      .reduce((hash, k) =>
        hash.update(`${k.toLowerCase()}:${mapping.headers[k]}`)
      , crypto.createHash('md5').update(normalizeUrl(mapping.url)))
      .digest('hex'));
}

function _handleResponse(response) {
  // cloning response so we can be read multiple times (b/c store)
  const json = response.clone().json();
  return response.status >= 200 && response.status < 300
    ? json
    : json.then((cause) => (Promise.reject(cause)));
}

/**
 * Overrides react-refetch `connect` function so we can return TptConnect
 * component instead of RefetchConnect.
 */
export default function connect(mapPropsToRequestsToProps = () => ({})) {
  return (WrappedComponent) => {
    // The original react-refetch component
    const RefetchConnect =
      refetchConnect(mapPropsToRequestsToProps)(WrappedComponent);

    return class TptConnect extends RefetchConnect {
      static contextTypes = {
        store: PropTypes.object.isRequired
      };

      /**
       * @override
       */
      constructor(props, context) {
        super(props, context);
        this.store = context.store;
      }

      /**
       * Allows getting/setting store
       * TODO: this is an almost exact copy of the original method
       * @override
       */
      createPromise(prop, mapping, startedAt) {
        const meta = mapping.meta;
        const initPS = this.createInitialPromiseState(prop, mapping);
        const onFulfillment = this.createPromiseStateOnFulfillment(prop, mapping, startedAt);
        const onRejection = this.createPromiseStateOnRejection(prop, mapping, startedAt);

        if (mapping.value) {
          this.setAtomicState(prop, startedAt, mapping, initPS(meta));
          return Promise.resolve(mapping.value).then(onFulfillment(meta), onRejection(meta));
        }

        const request = new Request(mapping.url, { ...mapping });
        meta.request = request;
        this.setAtomicState(prop, startedAt, mapping, initPS(meta));

        // the only addition to the original method
        let fetched = this.store.get(_storeKey(mapping), mapping.ttl);
        if (fetched) {
          mapping._fromStore = true;
        } else {
          fetched = window.fetch(request);
          if (mapping.method.toUpperCase() === 'GET') {
            this.store.set(_storeKey(mapping), fetched);
          }
        }

        return fetched.then((response) => {
          meta.response = response;
          return fetched.then(_handleResponse).then(onFulfillment(meta), onRejection(meta));
        });
      }

      /**
       * Allows to add default value to promise
       * @override
       */
      createInitialPromiseState(prop, mapping) {
        const defaultValue = mapping.default || (typeof mapping.type === 'function'
          ? new mapping.type() // eslint-disable-line new-cap
          : null);

        return (...args) => {
          const ps = super.createInitialPromiseState(prop, mapping)(...args);
          ps.value = defaultValue;
          return ps;
        };
      }

      /**
       * Allows rejecting promise on wrong response type
       * @override
       */
      createPromiseStateOnFulfillment(prop, mapping, startedAt) {
        const firstFunc = super.createPromiseStateOnFulfillment(prop, mapping, startedAt);
        return (meta) => {
          const secondFunc = firstFunc(meta);
          return (value) => {
            if (mapping.type && !(value instanceof mapping.type)) {
              throw new TypeError(`TptConnect expected value to be of type
                ${mapping.type.name}. Instead got ${value.constructor.name}`);
            }
            secondFunc(value);
          };
        };
      }
    };
  };
}
