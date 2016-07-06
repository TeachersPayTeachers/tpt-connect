import merge from 'lodash.merge';
import { logger } from '../helpers';
import {
  CONNECT_INVALIDATE,
  CONNECT_PREPOPULATE,
  CONNECT_REQUEST,
  CONNECT_SUCCESS,
  CONNECT_FAILURE
} from '../actions';

const TPT_CONNECT_TYPES = [
  CONNECT_INVALIDATE,
  CONNECT_PREPOPULATE,
  CONNECT_REQUEST,
  CONNECT_SUCCESS,
  CONNECT_FAILURE
];

export default function connectReducer(state = {}, { type, error, payload }) {
  if (!~TPT_CONNECT_TYPES.indexOf(type)) { return state; }

  let fetchesCount = state.fetchesCount || 0;

  if (error && type !== CONNECT_FAILURE) { // internal error
    fetchesCount--;
    logger.error(payload);
  } else if (type === CONNECT_FAILURE || type === CONNECT_SUCCESS) {
    fetchesCount--;
  } else if (type === CONNECT_PREPOPULATE) {
    fetchesCount++;
  }

  // TODO: i hate this:
  state.paramsToResources || (state.paramsToResources = {});
  if (payload.store === 'append') {
    Object.keys(payload.paramsToResources).forEach((key) => {
      state.paramsToResources[key] || (state.paramsToResources[key] = []);
      payload.paramsToResources[key] = state.paramsToResources[key]
        .concat(payload.paramsToResources[key]);
    });
  } else if (payload.store === 'reduct') {
    Object.keys(payload.paramsToResources).forEach((key) => {
      state.paramsToResources[key] || (state.paramsToResources[key] = []);
      payload.paramsToResources[key] = state.paramsToResources[key]
        .filter((id) => !payload.paramsToResources[key].includes(id));
    });
  }

  delete payload.store;

  return merge({}, state, payload, {
    paramsToResources: { // making sure we're not merging arrays
      ...state.paramsToResources,
      ...payload.paramsToResources
    },
    fetchesCount,
    isAllFetched: fetchesCount === 0,
    error: error ? payload : false
  });
}
