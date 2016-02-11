import { Component, PropTypes } from 'react';
import Cache from './cache';

/**
 * Used to create a context so our children can access our cache store
 */
export default class Provider extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired
  };

  static childContextTypes = {
    cache: PropTypes.instanceOf(Cache).isRequired
  };

  constructor(props, context) {
    super(props, context);
    this.cache = new Cache(this.props.store);
  }

  getChildContext() {
    return {
      cache: this.cache
    };
  }

  render() {
    return this.props.children;
  }
}
