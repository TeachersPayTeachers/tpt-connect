import mergeWith from 'lodash.mergewith';
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

  const storeOpt = payload.store;
  delete payload.store;

  return mergeWith({}, state, payload, {
    fetchesCount,
    isAllFetched: fetchesCount === 0,
    error: error ? payload : false
  }, (oldValue, newValue) => { // custom merger to handle arrays
    if (storeOpt && Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (storeOpt === 'append') { // TODO: concat only uniques?
        newValue = oldValue.concat(newValue);
      } else if (storeOpt === 'reduct') {
        newValue = oldValue.filter((id) => !newValue.includes(id));
      }
      return newValue;
    }
  });
}
