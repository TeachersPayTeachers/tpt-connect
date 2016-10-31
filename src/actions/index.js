import { CALL_API } from 'redux-api-middleware';
import { normalize as _normalize } from 'normalizr';
import { schemaKey, logger } from '../helpers';

export const TPT_CONNECT_REQUEST = 'TPT_CONNECT_REQUEST';
export const TPT_CONNECT_SUCCESS = 'TPT_CONNECT_SUCCESS';
export const TPT_CONNECT_FAILURE = 'TPT_CONNECT_FAILURE';
export const TPT_CONNECT_PREPOPULATE = 'TPT_CONNECT_PREPOPULATE';
export const TPT_CONNECT_INVALIDATE = 'TPT_CONNECT_INVALIDATE';

export function computePayload(resourceDefinition, meta, data, response) {
  const { schema, updateStrategy } = resourceDefinition;

  let indexedEntities = {};
  let indices = [];

  // TODO: refactor this...
  if (updateStrategy) {
    if (schema && typeof data === 'object') { // try to normalize & index
      const { normalize = _normalize } = resourceDefinition;
      let { entities = {}, result = [] } = normalize(data, schema);
      result = [].concat(result); // normalizr returns single id for non-arrays
      if (result.filter((id) => id).length === 0 && Object.keys(entities).length !== 0) {
        indices = [data]; // non-indexable
      } else {
        indices = result;
        indexedEntities = entities;
      }
    } else if (data) { // non-indexable
      if (schema) {
        const { normalize = (d) => d } = resourceDefinition;
        data = normalize(data);
      }
      indices = [data];
    }
  }

  return {
    updateStrategy, // so reducer can decide if to append paramsToResources or replace
    // TODO: this is shit
    lastResponse: typeof window === 'undefined' && meta.isError && response,
    resources: indexedEntities,
    paramsToResources: {
      [resourceDefinition.requestKey]: {
        meta,
        data: { [schemaKey(resourceDefinition)]: indices }
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

    const type = response.headers.get('content-type').toLowerCase().includes('application/json')
      ? 'json'
      : 'text';

    return response.clone()[type]().then((data) => {
      if (!response.ok) { throw new Error(JSON.stringify(data)); }
      logger.info('Fetched resource successfully:', resourceDefinition);

      // deferring so callbacks are called only after store is updated
      opts.onSuccess && setTimeout(() => {
        opts.onSuccess({ data, response });
      });

      return computePayload(resourceDefinition, meta, data);
    }).catch((err) => {
      logger.error('Failed to fetch resource:', resourceDefinition, err);

      // deferring so callbacks are called only after store is updated
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
    type: TPT_CONNECT_INVALIDATE,
    payload: computePayload(resourceDefinition, {
      didInvalidate: true
    })
  };
}

export function prepopulateResource(resourceDefinition) {
  return {
    type: TPT_CONNECT_PREPOPULATE,
    payload: computePayload(resourceDefinition, {
      isFetching: false,
      isError: false,
      isSuccess: false,
      lastUpdated: null
    })
  };
}

export function dispatchRequest(resourceDefinition, options) {
  const { headers, method, url: endpoint, body, credentials, redirect } = resourceDefinition;
  logger.info('Dispatching request:', resourceDefinition);
  return {
    [CALL_API]: {
      credentials,
      redirect,
      headers,
      method,
      endpoint,
      body: body || undefined,
      types: [{
        type: TPT_CONNECT_REQUEST,
        payload: computePayload(resourceDefinition, {
          isFetching: true,
          isError: false,
          isSuccess: false,
          lastUpdated: null
        })
      }, {
        type: TPT_CONNECT_SUCCESS,
        payload: onResponse(resourceDefinition, {
          isError: false,
          isSuccess: true
        }, options)
      }, {
        type: TPT_CONNECT_FAILURE,
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
