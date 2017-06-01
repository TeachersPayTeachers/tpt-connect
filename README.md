# TpT-Connect

[![CircleCI](https://circleci.com/gh/TeachersPayTeachers/tpt-connect.svg?style=svg&circle-token=3b926562683e2d1715753c3b9ace315165daa519)](https://circleci.com/gh/TeachersPayTeachers/tpt-connect)

TpT-Connect is a [Redux](https://github.com/reactjs/react-redux) extension
which creates simple interfaces for your React components' to interact with
your RESTful API.

TpT-Connect automatically fetches your components' data dependencies on
`componentWillMount` and `componentDidUpdate` when relevant props are changed
so you don't have to worry about when and how to fetch your data. To make your
resources available across multiple components, TpT-Connect normalizes and
caches your resources in its Redux state.

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
  }), optionalInitialState, applyMiddleware(connectMiddleware({ fetch: customFetchImpl })));

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
const userSchema = new Schema('user');

@defineResources((state, ownProps) => ({
  user: {
    schema: userSchema,
    url: `http://tpt.com/users/${ownProps.userId}`,
    actions: {
      delete: {
        method: 'DELETE'
      },
      update: (newProps) => ({
        method: 'PATCH',
        refetchAfter: true,
        body: {
          id: ownProps.userId,
          lastName: newProps.lastName
        }
      })
    }
  },

  followers: {
    schema: arrayOf(userSchema), // allows for normalization of users to be stored in one place
    url: `http://tpt.com/users/${ownProps.userId}/followers`,
    auto: false,
    actions: {
      create: ({ firstName, lastName }) => ({
        method: 'POST',
        updateStrategy: 'append', // updates the store with the additional follower ID
        body: { firstName, lastName }
      })
    }
  }
})
class User extends Component {
  static propTypes = {
    user: PropTypes.object,
    followers: PropTypes.object
  };

  render() {
    const { user, followers } = this.props;

    return (
      <div>
        <p>NAME: { user.value.name }</p>
        <button onClick={ user.delete }}>DELETE USER</button>
        <button onClick={ followers.fetch }>LOAD FOLLOWERS</button>
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

- `defaultValue` (`Any`, optional, defaults to `{}` or `[]` depending on
  schema) - used to define what `value` should be set to on prepopulate.

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
  the state), `'prepend'` (prepends resource to the existing resources in state)
  and `'remove'` (removes the returned resources from the resources
  in the state), `false` to not store at all, and if a function is passed in
  it will use it as a custom merge strategy calling with `function(newArray, oldArray)`.  
  This option is useful especially when an action returns returns an updated/deleted
  resource and you want TpT-Connect to update its store w/out having to make additional
  requests.

- `computeKey` (`Function`, optional) - a function which computes the keys stored in
  tpt-connect's store before hashing.  The arguments are `url`, `headers`, `method` and
  `body`.  By default tpt-connect concatenates and hashes the url, method type, body and
  all the headers.  This function can be used to make tpt-connect not hash the headers if
  they change but don't affect the request.

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
      until it is fetched successfully. Called by default on all of
      TpT-Connect's resources.

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

<!-- TODO: how does it compare? (with Relay, ReactAsyncConnect -->
