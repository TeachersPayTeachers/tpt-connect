import querystring from 'querystring';
import normalizeUrl from 'normalize-url';
import { merge } from 'lodash';
import { createStore as reduxCreateStore, combineReducers, applyMiddleware } from 'redux';
import { apiMiddleware } from 'redux-api-middleware';
import crypto from 'crypto';
import connectReducer from '../reducers';


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
 * Returns the normalizr schema key (ie 'item'/'items', etc)
 */
export function schemaKey({ schema }) {
  return schema.getKey
    ? schema.getKey()
    : schema.getItemSchema().getKey();
}

export function normalizeParams(params) {
  return querystring.stringify(_sortObject(params));
}

export function requestKey({ url, headers, method, body }) {
  return crypto.createHash('md5').update([
    method,
    url,
    normalizeParams(headers), // TODO: lowercase header keys
    normalizeParams(body)
  ].map(encodeURIComponent).join('|')).digest('hex');
}

export function findInState(state, resourceDefinition) {
  const { paramsToResources = {}, resources = {} } = state.connect;
  const { isArray, defaultValue } = resourceDefinition;

  const _requestKey = requestKey(resourceDefinition);
  const key = schemaKey(resourceDefinition);

  const resourceMap = paramsToResources[_requestKey];
  const resourceKeys = resourceMap && paramsToResources[_requestKey].data[key];

  if (!resourceKeys || resourceMap.meta.didInvalidate) {
    return false;
  }

  let mappedResources = resources[key]
    ? resourceKeys.map((id) => resources[key][id])
    : resourceMap.data[key];

  if (!mappedResources) {
    mappedResources = defaultValue;
  } else if (!isArray) {
    mappedResources = mappedResources.pop();
  }

  return merge(isArray ? [] : {}, mappedResources, { _meta: resourceMap.meta });
}

export function fullUrl(url, params) {
  url = url.replace(/\/+$/, '');
  params && (url = `${url}/?${normalizeParams(params)}`);
  return normalizeUrl(url);
}

/**
 * Adds tpt-connect middleware and reducer
 */
export function createStore(reducer, initialState, enhancer) {
  return applyMiddleware(apiMiddleware)(reduxCreateStore)(
    combineReducers({ connect: connectReducer, routing: reducer }),
    initialState,
    enhancer
  );
}
