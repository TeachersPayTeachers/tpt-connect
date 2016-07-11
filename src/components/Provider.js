import { Component, PropTypes } from 'react';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import connectReducer from '../reducers';
import { apiMiddleware } from 'redux-api-middleware';

class Provider extends Component {
  static childContextTypes = {
    store: PropTypes.object,
    options: PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
    const { store, ...options } = props;
    this.state = {
      store: store || createStore(
        combineReducers({ connect: connectReducer }),
        applyMiddleware(apiMiddleware({}))
      ),
      options
    };
  }

  getChildContext() {
    const { store, options } = this.state;
    return { store, options };
  }

  render() {
    return this.props.children;
  }
}

export default Provider;
