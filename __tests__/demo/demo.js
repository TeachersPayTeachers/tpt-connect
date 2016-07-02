import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
  defineResources,
  Schema,
  ConnectProvider
} from '../../src';

@defineResources((state, ownProps) => {
  return {
    user: {
      schema: new Schema('user'),
      url: `http://example.com/${ownProps.id}`,
      actions: {
        create: {
          method: 'POST',
          url: 'http://example.com/create',
          store: false
        },
        byId(id) {
          return {
            params: { id }
          };
        }
      }
    }
  };
})
class DemoComponent extends Component {
  componentDidMount() {
    const { user } = this.props;
    user.fetch();
    user.create();
    user.byId(7);
  }

  render() {
    const { children, user } = this.props;
    return (
      <div>
        This is your user:
        { JSON.stringify(user) }
        { children }
      </div>
    );
  }
}

function getTree(id = 3) {
  return (
    <ConnectProvider>
      <DemoComponent id={ id }>
        <p>And I'm a fucking child!</p>
      </DemoComponent>
    </ConnectProvider>
  );
}

window.onload = () => {
  ReactDOM.render(getTree(4), document.getElementById('mount'));
};
