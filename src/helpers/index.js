import invariant from 'invariant';
import { Children } from 'react';
import querystring from 'querystring';
import normalizeUrl from 'normalize-url';
import stringHash from 'string-hash';
import debug from 'debug';
import { Schema, normalize } from 'normalizr';
import { computePayload, dispatchRequest, prepopulateResource } from '../actions';
import { denormalize } from 'denormalizr';

/**
 * Sorts object alphabetically
 */
function _sortObject(obj = {}) {
  return Object.keys(obj)
    .sort()
    .reduce((_obj, key) => {
      _obj[key] = typeof obj[key] === 'object'
        ? _sortObject(obj[key])
        : obj[key];
      return _obj;
    }, {});
}

/**
 * Returns the normalizr schema key (ie 'item'/'items', etc) if there's a
 * schema, otherwise it returns 'default'
 */
export function schemaKey({ schema }) {
  if (!schema) { return 'default'; }
  return schema.getKey
    ? schema.getKey()
    : schema.getItemSchema().getKey();
}

export function normalizeParams(params = {}) {
  // querystring has a weird way of dealing w/ object and arrays, so we just
  // stringify here instead of letting it f it up.
  Object.keys(params).forEach((key) => {
    if (typeof params[key] === 'object') {
      params[key] = JSON.stringify(params[key]);
    }
  });
  return querystring.stringify(_sortObject(params));
}

function defaultComputeKey(url, headers, method, body) {
  return [
    method,
    url,
    normalizeParams(headers), // TODO: lowercase header keys
    normalizeParams(body)
  ].map(encodeURIComponent).join('|');
}

export function requestKey({ url, headers, method, body, computeKey = defaultComputeKey}) {
  return stringHash(computeKey(url, headers, method, body));
}

export function isInState(state, resourceDefinition) {
  return state &&
    state.connect &&
    state.connect.paramsToResources &&
    state.connect.paramsToResources[resourceDefinition.requestKey];
}

export function findInState(state = { connect: {} }, resourceDefinition) {
  const { paramsToResources = {}, resources = {} } = state.connect;
  const { isArray, defaultValue, schema } = resourceDefinition;
  const key = schemaKey(resourceDefinition);
  const resourceMap = paramsToResources[resourceDefinition.requestKey];
  const resourceKeys = resourceMap && resourceMap.data[key];

  if (!resourceKeys || resourceMap.meta.didInvalidate) {
    return false;
  }

  let mappedResources = resources[key]
    ? resourceKeys.map((id) => resources[key][id])
    : resourceMap.data[key];

  if (!mappedResources) {
    mappedResources = defaultValue;
  } else if (!isArray) {
    mappedResources = mappedResources[0];
  }

  return {
    meta: resourceMap.meta,
    value: schema && resources[key] ?
      denormalize(mappedResources, resources, schema) :
      mappedResources
  };
}

export function fullUrl(url, params) {
  params && (url = `${url}/?${normalizeParams(params)}`);
  return normalizeUrl(url, { stripWWW: false });
}

export const logger = (function () {
  const namespace = 'tptconnect';
  const error = debug(`${namespace}:error`);
  const info = debug(`${namespace}:info`);
  error.log = (...args) => (
    console.error
      ? Function.apply.call(console.error, console, args)
      : Function.apply.call(console.log, console, args)
  );
  info.log = (...args) => (
    console.info
      ? Function.apply.call(console.info, console, args)
      : Function.apply.call(console.log, console, args)
  );
  return { error, info };
}());

const definitionDefaults = {
  method: 'GET',
  normalize,
  actions: {},
  extends: {},
  clientOnly: false
};

export function normalizeResourceDefinition(definition) {
  definition = { ...definitionDefaults, ...(definition.extends || {}), ...definition };

  invariant(
    definition.url !== undefined,
    'Must include a URL for TpT-Connect to retrieve your resource'
  );

  invariant(
    !/\?[^#]/.test(definition.url),
    'Include query parameters under `params` in your resource definition ' +
    'instead of directly in the URL. That will improve TpT-Connect\'s ability' +
    'to cache your responses'
  );

  if (typeof definition.schema === 'string') {
    definition.schema = new Schema(definition.schema);
  }

  definition.url = fullUrl(definition.url, definition.params);
  definition.method = definition.method.toUpperCase();
  definition.requestKey = requestKey(definition);

  if (definition.isArray === undefined) {
    definition.isArray = definition.schema && !definition.schema.getKey;
  }

  if (definition.defaultValue === undefined) {
    definition.defaultValue = definition.isArray ? [] : {};
  }

  if (definition.method === 'GET') {
    if (definition.auto === undefined) {
      definition.auto = true;
    }
    if (definition.updateStrategy === undefined) {
      definition.updateStrategy = 'replace';
    }
  }

  return definition;
}

export function computeExternalPayload(resourceDefinition, json) {
  return computePayload(
    normalizeResourceDefinition(resourceDefinition),
    { isError: false, isSuccess: true },
    json
  );
}

export function extendFunction(...functions) {
  return (...args) => {
    for (const func of functions) {
      typeof func === 'function' && func.apply(this, args);
    }
  };
}

/**
 * Traverse a react tree and trigger all tpt-connect fetches so we dont have to
 * render twice
 *
 * idea taken from react-apollo
 * https://github.com/apollostack/react-apollo/blob/master/src/server.ts
 */
export const triggerFetches = (() => { // IIFE
  // If we're handling a stateless component we still need to traverse its
  // children. React uses a similar solution where it wraps it in a class and
  // gives it a `render` method.
  //
  // See:
  // https://github.com/facebook/react/blob/v15.0.1/src/renderers/shared/reconciler/ReactCompositeComponent.js#L43-L50
  // https://github.com/facebook/react/blob/v15.0.1/src/renderers/shared/reconciler/ReactCompositeComponent.js#L186-L198
  class StatelessComponent {
    constructor(Component, props, context) {
      this.Component = Component;
      this.props = props;
      this.context = context;
    }
    render() {
      // eslint-disable-next-line new-cap
      return this.Component(this.props, this.context, this.updater);
    }
  }

  // eslint-disable-next-line no-shadow
  return function triggerFetches(component, context = {}) {
    if (!component) { return; }

    if (typeof component === 'function') { // stateless
      component = { type: component };
    }

    const { type: Component, props = {} } = component; // TODO: can we get context here too?

    if (typeof Component !== 'function') { // html el?
      Children.forEach(props.children, (child) => {
        triggerFetches(child, context);
      });
    } else { // react component
      const ownProps = { ...(Component.defaultProps || {}), ...props };

      const inst = Component.prototype.render
        ? new Component(ownProps, context)
        : new StatelessComponent(Component, ownProps, context); // stateless

      try {
        // not sure why we need these
        inst.props = ownProps;
        inst.context = context;
        inst.setState = (newState) => { // simplify setState
          inst.state = { ...inst.state, ...newState };
        };
      } catch (e) {}

      // triggers fetch if tptconnect component
      if (inst.componentWillMount) {
        inst.componentWillMount();
      }

      if (inst.getChildContext) {
        context = { ...context, ...inst.getChildContext() };
      }

      const child = inst.render();

      triggerFetches(child, context);
    }
  };
})();

/**
 * Returns a promise which resolves when all tpt-connect requests have finished
 */
export function subscribeToStore(store) {
  return new Promise((resolve, reject) => {
    const { isAllFetched = true } = store.getState().connect;
    if (isAllFetched) {
      resolve();
      return;
    }

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();

      if (state.connect.error) {
        unsubscribe();
        reject({
          err: state.connect.error,
          response: state.connect.lastResponse
        });
        return;
      }

      if (state.connect.isAllFetched) {
        unsubscribe();
        resolve();
        return;
      }
    });
  });
}

/**
 * Subscribing to store changes so we can determine when tpt-connect is
 * done fetching its data before we re-render
 */
export function fetchTreeData(reactTree, store) {
  triggerFetches(reactTree);
  return subscribeToStore(store);
}

export function query(resourceDefinition, store) {
  resourceDefinition = normalizeResourceDefinition(resourceDefinition);
  store.dispatch(prepopulateResource(resourceDefinition));
  store.dispatch(dispatchRequest(resourceDefinition, {}));
  return subscribeToStore(store);
}

