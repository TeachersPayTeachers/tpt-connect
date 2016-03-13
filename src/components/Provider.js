import { Component, PropTypes } from 'react';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import connectReducer from '../reducers';
import { apiMiddleware } from 'redux-api-middleware';

class Provider extends Component {
  static childContextTypes = {
    store: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      store: props.store || createStore(
        combineReducers({ connect: connectReducer }),
        applyMiddleware(apiMiddleware)
      )
    };
  }

  getChildContext() {
    return {
      store: this.state.store
    };
  }

  render() {
    return this.props.children;
  }
}

export default Provider;
