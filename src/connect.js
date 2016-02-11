/**
 * TptConnect adds the following attributes to each mapping:
 * - ttl - for how long should the mapping be cached. If not provided, no caching will be used.
 * - type - will validate we get the correct type or else reject the promise.
 *   also used to set default value if missing
 * - default - default value to populate the `value` property of the promise with
 */

import { PropTypes } from 'react';
import { connect as refetchConnect } from 'react-refetch';

/**
 * Generates cache key based on the `comparison` string provided or the
 * request's URL.
 */
function _cacheKey(mapping) {
  return mapping.comparison || mapping.url;
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
        cache: PropTypes.object.isRequired
      };

      /**
       * @override
       */
      constructor(props, context) {
        super(props, context);
        this.cache = context.cache;
      }

      /**
       * Allows using cache before defaulting to network to fetch value
       * @override
       */
      refetchDataFromMappings(mappings) {
        let mapping;
        Object.keys(mappings).forEach((prop) => {
          mapping = mappings[prop];
          if (!mapping.force && mapping.ttl) { // try to get cached data
            // populating mapping.value will set it immediately w/out making the request
            mapping.value = this.cache.get(_cacheKey(mapping), mapping.ttl);
            if (mapping.value) {
              mapping._isCache = true;
              // react-refetch won't allow value & url to be set together
              mapping.url = null;
            }
          }
        });
        return super.refetchDataFromMappings(mappings);
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
       * Allows storing network response in cache
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
            if (!mapping._isCache && mapping.method.toUpperCase() === 'GET') {
              this.cache.set(_cacheKey(mapping), value);
            }
            secondFunc(value);
          };
        };
      }
    };
  };
}
