import querystring from 'querystring';
import normalizeUrl from 'normalize-url';
import { merge } from 'lodash';
import crypto from 'crypto';

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
    mappedResources = mappedResources[0];
  }

  return merge(isArray ? [] : {}, mappedResources, { _meta: resourceMap.meta });
}

export function fullUrl(url, params) {
  url = url.replace(/\/+$/, '');
  params && (url = `${url}/?${normalizeParams(params)}`);
  return normalizeUrl(url, { stripWWW: false });
}
