import { CALL_API } from 'redux-api-middleware';
import { schemaKey, requestKey } from '../helpers';
import { merge } from 'lodash';

export const CONNECT_REQUEST = 'CONNECT_REQUEST';
export const CONNECT_SUCCESS = 'CONNECT_SUCCESS';
export const CONNECT_FAILURE = 'CONNECT_FAILURE';

function computePayload(resourceDefinition, meta, json) {
  const { schema, normalize } = resourceDefinition;
  const { entities = {}, result = [] } = json
    ? normalize(json, schema)
    : {};

  return {
    resources: entities,
    paramsToResources: {
      [requestKey(resourceDefinition)]: {
        meta,
        data: { [schemaKey(resourceDefinition)]: result }
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
    });

    return response.json().then((json) => {
      return computePayload(resourceDefinition, { ...meta, response }, json);
    }).catch(() => {
      meta.isError = true;
      return computePayload(resourceDefinition, { ...meta, response });
    });
  };
}

export default function request(resourceDefinition) {
  const { headers, method, url: endpoint, body } = resourceDefinition;
  return {
    [CALL_API]: {
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
