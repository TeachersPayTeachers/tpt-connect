import { CALL_API } from 'redux-api-middleware';
import { schemaKey, logger } from '../helpers';
import { normalize as _normalize } from 'normalizr';

export const CONNECT_REQUEST = 'CONNECT_REQUEST';
export const CONNECT_SUCCESS = 'CONNECT_SUCCESS';
export const CONNECT_FAILURE = 'CONNECT_FAILURE';
export const CONNECT_PREPOPULATE = 'CONNECT_PREPOPULATE';
export const CONNECT_INVALIDATE = 'CONNECT_INVALIDATE';

export function computePayload(resourceDefinition, meta, data, response) {
  const { schema, normalize = _normalize, store } = resourceDefinition;
  if (!store) { return {}; }

  const { entities = {}, result = [] } = typeof data === 'object'
    ? normalize(data, schema)
    : {};

  // if data is not indexable just wrap it in array and store directly under paramsToResources
  data = data && (typeof data === 'string' || result.length === 0 && Object.keys(entities).length !== 0)
    ? [data]
    : [].concat(result);

  return {
    store, // so reducer can decide if to append paramsToResources or replace
    lastResponse: typeof window === 'undefined' && response,
    resources: result.length !== 0 ? entities : {},
    paramsToResources: {
      [resourceDefinition.requestKey]: {
        meta,
        data: { [schemaKey(resourceDefinition)]: data },
      }
    }
  };
}

function onResponse(resourceDefinition, meta, opts) {
  return (action, state, response) => {
    meta = {
      ...meta,
      didInvalidate: false,
      isFetching: false,
      lastUpdated: Date.now()
    };

    const type = response.headers.get('content-type').toLowerCase().includes('text/html')
      ? 'text'
      : 'json';

    return response[type]().then((data) => {
      if (!response.ok) { throw new Error(JSON.stringify(data)); }
      logger.info('Fetched resource successfully:', resourceDefinition);
      opts.onSuccess && setTimeout(() => {
        opts.onSuccess({ data, response });
      });
      return computePayload(resourceDefinition, meta, data);
    }).catch((err) => {
      logger.error('Failed to fetch resource:', resourceDefinition, err);
      opts.onError && setTimeout(() => {
        opts.onError({ error: err, response });
      });
      meta = {
        ...meta,
        isSuccess: false,
        isError: true,
        response
      };

      let data;
      try {
        data = JSON.parse(err.message);
      } catch (e) {}

      return computePayload(resourceDefinition, meta, data, response);
    });
  };
}

export function invalidateResource(resourceDefinition) {
  logger.info('Invalidating resource:', resourceDefinition);
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

export function dispatchRequest(resourceDefinition, options) {
  const { headers, method, url: endpoint, body } = resourceDefinition;
  logger.info('Dispatching request:', resourceDefinition);
  return {
    [CALL_API]: {
      credentials: 'include',
      redirect: 'manual',
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
        }, options)
      }, {
        type: CONNECT_FAILURE,
        payload: onResponse(resourceDefinition, {
          isError: true,
          isSuccess: false
        }, options)
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
