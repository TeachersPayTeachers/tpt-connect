import mergeWith from 'lodash.mergewith';
import { logger } from '../helpers';
import {
  TPT_CONNECT_INVALIDATE,
  TPT_CONNECT_PREPOPULATE,
  TPT_CONNECT_REQUEST,
  TPT_CONNECT_SUCCESS,
  TPT_CONNECT_FAILURE
} from '../actions';

const TPT_CONNECT_TYPES = [
  TPT_CONNECT_INVALIDATE,
  TPT_CONNECT_PREPOPULATE,
  TPT_CONNECT_REQUEST,
  TPT_CONNECT_SUCCESS,
  TPT_CONNECT_FAILURE
];

export default function connectReducer(state = {}, { type, error, payload }) {
  if (!~TPT_CONNECT_TYPES.indexOf(type)) { return state; }

  let fetchesCount = state.fetchesCount || 0;

  if (error && type !== TPT_CONNECT_FAILURE) { // internal error
    fetchesCount--;
    logger.error(payload);
  } else if (type === TPT_CONNECT_FAILURE || type === TPT_CONNECT_SUCCESS) {
    fetchesCount--;
  } else if (type === TPT_CONNECT_PREPOPULATE) {
    fetchesCount++;
  }

  const { updateStrategy } = payload;
  delete payload.updateStrategy;

  return mergeWith({}, state, payload, {
    fetchesCount,
    isAllFetched: fetchesCount === 0,
    error: error ? payload : false
  }, (oldValue, newValue) => { // custom merger to handle arrays
    if (updateStrategy && Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (updateStrategy === 'append') { // TODO: concat only uniques?
        newValue = oldValue.concat(newValue);
      } else if (updateStrategy === 'prepend') {
        newValue = newValue.concat(oldValue);
      } else if (updateStrategy === 'remove') {
        newValue = oldValue.filter((id) => !newValue.includes(id));
      } else if (typeof updateStrategy === 'function') {
        newValue = updateStrategy(newValue, oldValue);
      }
      return newValue;
    }
  });
}
