# TpT-Connect

TpT-Connect is an extension to [Redux](https://github.com/reactjs/redux) which
creates a simple interface for components' data fetching.

## Install

```Bash
$ npm install --save @teachers/tpt-connect
```

## Usage

#### As a black box

```JavaScript
import { ConnectProvider } from '@teachers/tpt-connect';

render() {
  <ConnectProvider>
    <RootComponent />
  </ConnectProvider>
}
```

#### As a Redux plugin

Create your Redux store with the `tpt-connect`'s reducer and middleware:

```JavaScript
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { connectReducer, connectMiddleware } from '@teachers/tpt-connect';

const store =
  createStore(combineReducers({
    main: rootReducer,
    connect: connectReducer
  }), optionalInitialState, applyMiddleware(connectMiddleware));

render() {
  <Provider store={store}>
    <RootComponent />
  </Provider>
}
```

#### And in your components throughout the app:

```JavaScript
import { connect, Schema } from '@teachers/tpt-connect';

class User extends Component {
  static propTypes = {
    user: PropTypes.object,
    deleteUser: PropTypes.object,
    fetchResource: PropTypes.func,
    resources: PropTypes.object
  };

  renderDeleteNotification() {
    return (
      <p>This user is deleted, brah.</p>
    )
  }

  render() {
    const { user, fetchResource, resources: { deleteUser } } = this.props;

    return (
      <div>
        {deleteUser.meta.isSuccess && this.renderDeleteNotification()}
        <p>Name: {user.name}</p>
        <p>Deleted: {user.isDeleted}</p>
        <button onClick={() => { fetchResource(deleteUser) }}>
          DELETE USER
        </button>
      </div>
    );
  }
}

exports default connect((state, ownProps) => {
  const userSchema = new Schema('user');

  return {
    resources: { // Resource defintions
      user: {
        schema: userSchema,
        url: `http://tpt.com/users/${ownProps.userId}`
      },
      deleteUser: {
        method: 'DELETE',
        schema: userSchema,
        url: `http://tpt.com/users/${ownProps.userId}`
      }
    }

  };
})(User);
```

The aforementioned `connect` function is an extension to
[React-Redux](https://github.com/reactjs/react-redux)'s method and therefore it
offers all of the functionality the Redux method does.

The only additions are the `resources` object which lists definitions for the
resources required for the component, and the `fetchResource` method which
dispatches a request action.

These are the options each resource definition takes:

- `auto` (`Boolean`, optional, defaults to `true` when `GET`; otherwise `false`) -
  determines whether the request should be dispatched automatically on
  `componentDidMount` and on `componentDidUpdate` when the resource definition
  changed (ie URL is dependent on `props.id` and it changes after a client
  action).

- `schema` (`Schema`, required) - an instance of
  [normalizr](://github.com/gaearon/normalizr)'s `Schema` used for TpT-Connect
  to infer how the resource returned to be stored in the global state for
  future use.

- `url` (`String`, required) - a complete url of the endpoint

- `params` (`Object`, optional) - an object listing the endpoint's query params.
  This is the preferred method to add query params to a request. If the params
  are hardcoded in the URL, TpT-Connect will not be able to normalize them and
  store the resource for future use by other components.

- `method` (`Object`, optional, defaults to `GET`) - the request's method to be
  used.

- `headers` (`Object`, optional, defaults to `{ 'Content-Type':
  'application/json' }`) - the request's headers.

- `body` (`Object`, optional) - the request's payload.

- `extends` (`Object`, optional) - a resource definition this definition
  inherits from. This is useful to centralize resource definitions to be
  used across multiple components.

- `clientOnly` (`Boolean`, options, defaults to `false`) - will prevent
  resources from being fetched when rendered on the server (when `isServer` is
  set to `true` on `ConnectProvider`).

- `normalize` (`Function`, optional, defaults to
  [normalizr](https://github.com/gaearon/normalizr#normalizeobj-schema-options)'s
  `normalize`) - a function used to normalize the JSON returned from the
  server. Useful when responses are nested within additional properties. The
  function has the following signature:

  ```
  normalize(Object json, Schema schema, [Object options]) : Object normalizedJson
  ```

### Debugging

TpT-Connect uses [debug](https://github.com/visionmedia/debug). In order to
turn on more verbose logging, set the `tptconnect` namespace in localStorage to
allow `info`, `error`, or all via `*`. For example, to enable all levels of
logging for TpT-Connect, set:

```JavaScript
localStorage.debug = 'tptconnect:*';
```
