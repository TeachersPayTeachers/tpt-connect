# TpT-Connect

[![CircleCI](https://circleci.com/gh/TeachersPayTeachers/tpt-connect.svg?style=svg&circle-token=3b926562683e2d1715753c3b9ace315165daa519)](https://circleci.com/gh/TeachersPayTeachers/tpt-connect)

TpT-Connect is an extension to [Redux](https://github.com/reactjs/redux) which
creates a simple interface for components' data fetching.

TpT-Connect fetches your components' data dependencies on `componentDidMount`
and `componentDidUpdate` when relevant props are changed so you don't have to
worry about when and how to fetch your data. It also stores the server's
returned resources in a normalized way so it can be used later by other
components with the same dependencies.

## Install

```Bash
$ npm install --save @teachers/tpt-connect
```

## Usage

#### Option 1: As a black box

```JavaScript
import { ConnectProvider } from '@teachers/tpt-connect';

render() {
  <ConnectProvider>
    <RootComponent />
  </ConnectProvider>
}
```

#### Option 2: As a Redux plugin

Create your Redux store with the `tpt-connect`'s reducer and middleware:

```JavaScript
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { connectReducer, connectMiddleware } from '@teachers/tpt-connect';

const store =
  createStore(combineReducers({
    main: rootReducer,
    connect: connectReducer
  }), optionalInitialState, applyMiddleware(connectMiddleware));

render() {
  <Provider store={ store }>
    <RootComponent />
  </Provider>
}
```

----

#### And in your components throughout the app:

```JavaScript
import { defineResources, Schema, arrayOf } from '@teachers/tpt-connect';

@defineResources((state, ownProps) => {
  const usersSchema = new Schema('users');

  // this will pull out users if we got them nested under `followers` with the
  // initial user request
  usersSchema.define({
    followers: arrayOf(usersSchema)
  });

  return {
    user: {
      schema: usersSchema,
      url: `http://tpt.com/users/${ownProps.userId}`,
      actions: {
        delete: {
          method: 'DELETE'
        },
        update: (newProps) => ({
          method: 'PATCH',
          updateStrategy: 'replace', // will replace the current user with the returned resource
          body: {
            id: ownProps.userId,
            lastName: newProps.lastName
          }
        })
      }
    },

    followers: {
      schema: arrayOf(usersSchema), // handling same resource schema
      url: `http://tpt.com/users/${ownProps.userId}/followers`,
      auto: false,
      actions: {
        create: (params) => ({
          method: 'POST',
          updateStrategy: 'append', // will update the store with the additional follower ID
          body: {
            firstName: params.firstName,
            lastName: params.lastName
          }
        }),
        delete: (followerId) => ({
          method: 'DELETE',
          updateStrategy: 'remove', // will remove the returned id from our follower IDs
          url: `http://tpt.com/users/${ownProps.userId}/followers/${followerId}`
        })
      }
    }
  };
})
class User extends Component {
  static propTypes = {
    user: PropTypes.object
  };

  renderDeleteNotification() {
    return (
      <p>This user is deleted, brah.</p>
    )
  }

  render() {
    const { user, followers } = this.props;

    return (
      <div>
        { user.value.isDeleted && this.renderDeleteNotification() }
        <p>Name: { user.value.name }</p>
        <p>Deleted: { user.value.isDeleted }</p>

        <button onClick={ user.delete }}>
          DELETE USER
        </button>

        <button onClick={ followers.fetch }>
          Load User Followers
        </button>

        <div>
          { followers.value.map((follower) =>
            <div>
              <p>{ follower.name }</p>
              <button onClick={ () => followers.delete(follower.id) }>Remove Follower</button>
            </div>
          ) }
        </div>
      </div>
    );
  }
}

export default User;
```

These are the options each resource definition takes:

- `auto` (`Boolean`, optional, defaults to `true` when `GET`; otherwise `false`) -
  determines whether the request should be dispatched automatically on
  `componentDidMount` and on `componentDidUpdate` when the resource definition
  changed (ie URL is dependent on `props.id` and it changes after a client
  action).

- `schema` (`Schema|String`, optional) - an instance of
  [normalizr](://github.com/gaearon/normalizr)'s `Schema` used for TpT-Connect
  to infer how the resource returned to be stored in the global state for
  future use. If a string is given, TpT-Connect will convert it to a simple
  normalizr Schema with the string as the key. If Schema is not provided,
  TpT-Connect will not attempt to normalize any of the data returned from the
  server.

- `url` (`String`, required) - a complete url of the endpoint

- `params` (`Object`, optional) - an object listing the endpoint's query params.
  This is the preferred method to add query params to a request. If the params
  are hardcoded in the URL, TpT-Connect will not be able to normalize them and
  store the resource for future use by other components.

- `method` (`String`, optional, defaults to `GET`) - the request's method to be
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

- `updateStrategy` (`Boolean|String`, optional, defaults to `replace` when
  `GET`; otherwise `false`) - whether or not TpT-Connect should store the
  response data in its Redux store. Available options are: `'replace'` (same as
  `true`), `'append'` (adds the returned resource to the existing resources in
  the state), and `'remove'` (removes the returned resources from the resources
  in the state), or `false` to not store at all. This options is useful
  especially when an action returns returns an updated/deleted resource and you
  want TpT-Connect to update its store w/out having to make additional
  requests.

- `debounce` (`Number`, optional) - number of milliseconds TpT-Connect should
  debounce subsequent requests by for this resource definition. For example,
  this feature would be useful when used to fetch search results as the user
  types.

- `actions` (`Object`, optional) - an object defining functions, or
  sub-objects, which are used as sub-resource definitions to request at a later
  time and will be available on the TpT-Connect resource. Calling an action
  will execute the defined action and return the promise yielded from the
  dispatched request. For more information, check out the example above.

  - Action specific properties - generally actions have the same attributes
    declared above for resource definitions, with a few additional attributes:

    - `refetchAfter` (`Boolean|String`, optional, defaults to `false`) -
      whether or not TpT-Connect should refetch the resource after the action
      completes. Set to `'success'` to refetch only after successful response or
      `'error'` to only refetch after failure.

  - Built-in actions on all resources:
    - `fetch` - force fetch the data.
    - `invalidate` - marks the data as invalid in the store and therefore will
      not retrieve it from the state anymore.
    - `prepopulate` - prepopulate the store with a placeholder for the resource
      until it is fetched successfully.

### Server Rendering

Thanks to TpT-Connect keeping track of its outstanding requests for resources
in its store, the above example could be easily rendered on the server as well:

```JavaScript

// By setting `isServer`, TpT-Connect knows to fetch even w/out
// `componentDidMount` which is called only on client
const tree = (
  <ConnectProvider isServer store={ myStore }>
    <RootComponent />
  </ConnectProvider>
);

// Subscribing to our store so we can respond to client only when all of our
// data is ready
const unsubscribe = myStore.subscribe(() => {
  if (myStore.getState().connect.isAllFetched) {
    // trigger second render now that we have all data
    const html = ReactDOM.renderToStaticMarkup(tree);
    unsubscribe();
    res.status(200).send(html);
  }
});

// First render to trigger all of TpT-Connect's automatic fetches
ReactDOM.renderToStaticMarkup(tree);

```

### Debugging

TpT-Connect uses [debug](https://github.com/visionmedia/debug). In order to
turn on more verbose logging, set the `tptconnect` namespace in localStorage to
allow `info`, `error`, or all via `*`. For example, to enable all levels of
logging for TpT-Connect, set:

```JavaScript
localStorage.debug = 'tptconnect:*';
```

(NOTE: when running on the server, set the env var `DEBUG`)

