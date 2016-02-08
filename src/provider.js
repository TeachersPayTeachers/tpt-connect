import { Component, PropTypes } from 'react';

/**
 * Used to create a context so our children can access our cache store
 */
export default class Provider extends Component {
  static childContextTypes = {
    cache: PropTypes.shape({
      get: PropTypes.func.isRequired,
      set: PropTypes.func.isRequired
    })
  };

  getChildContext() {
    return {
      cache: this.props.cache
    };
  }

  render() {
    return this.props.children;
  }
}
