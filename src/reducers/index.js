import { merge } from 'lodash';
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

  return merge({}, state, payload, {
    fetchesCount,
    isAllFetched: fetchesCount === 0,
    error: error ? payload : false
  });
}
