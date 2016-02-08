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
 * Overrides react-refetch `connect` function so we can return TptConnect
 * component instead of RefetchConnect.
 */
export default function connect(mapPropsToRequestsToProps = () => ({})) {
  return (WrappedComponent) => {
    // The original react-refetch component
    const RefetchConnect =
      refetchConnect(mapPropsToRequestsToProps)(WrappedComponent);

    class TptConnect extends RefetchConnect {
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
            mapping.value = this.getCachedData(prop, mapping);
            if (mapping.value) {
              mapping.value._isCache = true;
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
          ? mapping.type()
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
            if (!value._isCache && mapping.ttl) {
              this.setCachedData(prop, mapping, value);
            }
            secondFunc(value);
          };
        };
      }

      /**
       * Generates cache key based on the `comparison` string provided or the
       * request's URL.
       */
      cacheKeyFor(prop, mapping) {
        // TODO: ultimately, we should use ['value', 'url', 'method', 'headers',
        // 'body'] to construct our comparison string (at least that's how
        // react-refetch checks for mappings equality to determine if it needs to
        // make anther request), but all we have at this point (before calling
        // `coerceMappings` which is private) is the property name and the URL
        const key = mapping.comparison || mapping.url;
        return [this.constructor.name, prop, key].join(this.cache.options.prefixSeparator);
      }

      setCachedData(prop, mapping, value) {
        this.cache.set(this.cacheKeyFor(prop, mapping), value);
      }

      getCachedData(prop, mapping) {
        // TODO: this is hacky. it sets the cache expiration every time before
        // we get the value so we dont end up w stale values
        this.cache.options.expiration = mapping.ttl;
        return this.cache.get(this.cacheKeyFor(prop, mapping));
      }
    }

    return TptConnect;
  };
}
