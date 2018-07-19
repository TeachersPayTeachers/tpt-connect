import { RSAA } from 'redux-api-middleware';
import { normalize as _normalize } from 'normalizr';
import { schemaKey, logger } from '../helpers';

export const TPT_CONNECT_REQUEST = 'TPT_CONNECT_REQUEST';
export const TPT_CONNECT_SUCCESS = 'TPT_CONNECT_SUCCESS';
export const TPT_CONNECT_FAILURE = 'TPT_CONNECT_FAILURE';
export const TPT_CONNECT_PREPOPULATE = 'TPT_CONNECT_PREPOPULATE';
export const TPT_CONNECT_INVALIDATE = 'TPT_CONNECT_INVALIDATE';

/**
 * This function tries to normalize the data given to it with the
 * normalize function the client provided. if a normalize function is missing,
 * itll default to normalizr's normalize which is a bit tricky and requires some
 * help; if the normalize function was given non-indexable data but was expected
 * to index it (given a schema), it'll return the raw data as-is. If no schema
 * was given (ie no indexing was expected), but there's a normalize function,
 * the returned data will be the normalized data will be returned but w/out any
 * indexing.
 */
function normalizeData({ normalize = _normalize, schema }, data) {
  let normalizedData = data;
  try {
    normalizedData = normalize(data, schema);

    if (schema) { // tried normalizing indexed data
      let {
        entities = {}, // indexed resources
        result = [] // just indices
      } = normalizedData;

      // normalizr return single id for non-arrays
      result = []
        .concat(result)
        .filter((i) => i || i === 0);

      // data is non-indexable (missing ids most likely)
      if (!result.length && Object.keys(entities).length) {
        normalizedData = data; // use raw data
      } else { // everything was a-ok
        return { result, entities };
      }
    }
  } catch (e) { /* carry on */ }
  return {
    result: [normalizedData]
  };
}

export function computePayload(resourceDefinition, meta, data, response, error) {
  const { updateStrategy } = resourceDefinition;

  const {
    result = [], // indices
    entities = {} // indexed entities
  } = data && updateStrategy
    ? normalizeData(resourceDefinition, data)
    : {};

  return {
    updateStrategy, // so reducer can decide if to append paramsToResources or replace
    error,
    // TODO: this is shit
    lastResponse: typeof window === 'undefined' && meta.isError && response,
    resources: entities,
    paramsToResources: {
      [resourceDefinition.requestKey]: {
        meta,
        data: { [schemaKey(resourceDefinition)]: result }
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

    const contentTypeHeader = response.headers.get('content-type');

    const type = contentTypeHeader && contentTypeHeader.toLowerCase().includes('application/json')
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

      return computePayload(resourceDefinition, meta, data, response, err);
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
    [RSAA]: {
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
