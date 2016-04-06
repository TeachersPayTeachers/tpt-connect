import { CALL_API } from 'redux-api-middleware';
import { schemaKey, requestKey } from '../helpers';
import { merge } from 'lodash';
import { normalize as _normalize } from 'normalizr';

export const CONNECT_REQUEST = 'CONNECT_REQUEST';
export const CONNECT_SUCCESS = 'CONNECT_SUCCESS';
export const CONNECT_FAILURE = 'CONNECT_FAILURE';
export const CONNECT_PREPOPULATE = 'CONNECT_PREPOPULATE';
export const CONNECT_INVALIDATE = 'CONNECT_INVALIDATE';

function computePayload(resourceDefinition, meta, json) {
  const { schema, normalize = _normalize } = resourceDefinition;
  const { entities = {}, result = [] } = json
    ? normalize(json, schema)
    : {};

  return {
    resources: entities,
    paramsToResources: {
      [requestKey(resourceDefinition)]: {
        meta,
        data: { [schemaKey(resourceDefinition)]: [].concat(result) }
      }
    }
  };
}

function onResponse(resourceDefinition, meta) {
  return (action, state, response) => {
    meta = merge({}, {
      didInvalidate: false,
      isFetching: false,
      lastUpdated: Date.now()
    }, meta);

    return response.json().then((json) => {
      return computePayload(resourceDefinition, { ...meta, response }, json);
    }, () => {
      meta = merge({}, meta, { isSuccess: false, isError: true });
      return computePayload(resourceDefinition, { ...meta, response });
    });
  };
}

export function invalidateResource(resourceDefinition) {
  return {
    type: CONNECT_INVALIDATE,
    payload: computePayload(resourceDefinition, {
      didInvalidate: true
    })
  };
}

export function prepopulateResource(resourceDefinition) {
  return {
    type: CONNECT_PREPOPULATE,
    payload: computePayload(resourceDefinition, {
      isFetching: false,
      isError: false,
      isSuccess: false,
      lastUpdated: null
    })
  };
}

export function fetchResource(resourceDefinition) {
  const { headers, method, url: endpoint, body } = resourceDefinition;
  return {
    [CALL_API]: {
      credentials: 'include',
      headers,
      method,
      endpoint,
      body: body || undefined,
      types: [{
        type: CONNECT_REQUEST,
        payload: computePayload(resourceDefinition, {
          isFetching: true,
          isError: false,
          isSuccess: false,
          lastUpdated: null
        })
      }, {
        type: CONNECT_SUCCESS,
        payload: onResponse(resourceDefinition, {
          isError: false,
          isSuccess: true
        })
      }, {
        type: CONNECT_FAILURE,
        payload: onResponse(resourceDefinition, {
          isError: true,
          isSuccess: false
        })
      }]
    }
  };
}

/*
 * Example of our state:
 *
{
  paramsToResources: {
    [hashed key comprised of `method`, `url`, `headers`, `body`]
      meta: {
        isFetching: false,
        isError: false,
        didInvalidate: false,
        lastUpdated: 143129809
      },
      data: {
        user: [23, 39],
        item: [3, 4]
      }
    }
  },
  resources: {
    users: {
      23: {
        name: 'Peleg',
        email: 'peleg3@gmail.com'
      }
    }
  }
}

*/
