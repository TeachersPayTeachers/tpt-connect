import { Component, PropTypes } from 'react';
import Store from './store';

/**
 * Used to create a context so our children can access our cache
 */
export default class Provider extends Component {
  static propTypes = {
    state: PropTypes.object
  };

  static childContextTypes = {
    store: PropTypes.instanceOf(Store).isRequired
  };

  constructor(props, context) {
    super(props, context);
    this.store = new Store(this.props.state);
  }

  getChildContext() {
    return {
      store: this.store
    };
  }

  render() {
    return this.props.children;
  }
}
