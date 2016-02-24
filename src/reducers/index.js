import { merge } from 'lodash';
import { CONNECT_REQUEST, CONNECT_SUCCESS, CONNECT_FAILURE } from '../actions';

export default function connectReducer(state = {}, action) {
  const { type, ...props } = action;

  if (~[CONNECT_REQUEST, CONNECT_SUCCESS, CONNECT_FAILURE].indexOf(type)) {
    if (props.error && type !== CONNECT_FAILURE) { // internal error
      console.error(props.payload);
      throw new Error(props.payload.message);
    }
    return merge({}, state, props.payload);
  }

  return state;
}
