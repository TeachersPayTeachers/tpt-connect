import { merge } from 'lodash';
import { logger } from '../helpers';
import {
  CONNECT_INVALIDATE,
  CONNECT_PREPOPULATE,
  CONNECT_REQUEST,
  CONNECT_SUCCESS,
  CONNECT_FAILURE
} from '../actions';

export default function connectReducer(state = {}, action) {
  const { type, ...props } = action;

  if (~[
    CONNECT_INVALIDATE,
    CONNECT_PREPOPULATE,
    CONNECT_REQUEST,
    CONNECT_SUCCESS,
    CONNECT_FAILURE
  ].indexOf(type)) {
    if (props.error && type !== CONNECT_FAILURE) { // internal error
      logger.error(props.payload);
    }
    return merge({}, state, props.payload);
  }

  return state;
}
