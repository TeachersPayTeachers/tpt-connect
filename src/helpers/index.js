import invariant from 'invariant';
import { Children } from 'react';
import querystring from 'querystring';
import normalizeUrl from 'normalize-url';
import stringHash from 'string-hash';
import debug from 'debug';
import { Schema, normalize } from 'normalizr';
import { computePayload } from '../actions';

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

export function requestKey({ url, headers, method, body }) {
  return stringHash([
    method,
    url,
    normalizeParams(headers), // TODO: lowercase header keys
    normalizeParams(body)
  ].map(encodeURIComponent).join('|'));
}

export function isInState(state, resourceDefinition) {
  return state &&
    state.connect &&
    state.connect.paramsToResources &&
    state.connect.paramsToResources[resourceDefinition.requestKey];
}

export function findInState(state = { connect: {} }, resourceDefinition) {
  const { paramsToResources = {}, resources = {} } = state.connect;
  const { isArray, defaultValue } = resourceDefinition;
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
    value: mappedResources
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
export function triggerFetches(component, context = {}) {
  if (!component) { return; }

  if (typeof component === 'function') { // stateless
    component = { type: component };
  }

  const { type, props = {} } = component; // TODO: can we get context here too?

  if (typeof type !== 'function') { // html el?
    Children.forEach(props.children, (child) => {
      triggerFetches(child, context);
    });
  } else { // react component
    const ownProps = { ...(type.defaultProps || {}), ...props };
    const Component = new type(ownProps, context);

    try {
      // not sure why we need these
      Component.props = ownProps;
      Component.context = context;
      Component.setState = (newState) => { // simplify setState
        Component.state = { ...Component.state, ...newState };
      };
    } catch (e) {}

    // triggers fetch if tptconnect component
    if (Component.componentWillMount) {
      Component.componentWillMount();
    }

    if (Component.getChildContext) {
      context = { ...context, ...Component.getChildContext() };
    }

    const child = Component.render
      ? Component.render()
      : Component;

    triggerFetches(child, context);
  }
}

/**
 * Subscribing to store changes so we can determine when tpt-connect is
 * done fetching its data before we re-render
 */
export function fetchTreeData(reactTree, store) {
  const promise = new Promise((resolve, reject) => {
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

  triggerFetches(reactTree);

  return promise;
}

