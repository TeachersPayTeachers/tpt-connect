# TpT-Connect

An extension to Heroku's
[React-Refetch](https://github.com/heroku/react-refetch), TpT Connect
simplifies and adds additional functionality.

## Install

```Bash
$ npm install --save @tpt/tpt-connect # TODO: is this the real name?
```

## Usage

Wrap your root component inside `Provider` and provide it with your cache store
as a property:

```JavaScript
import { Provider } from 'tpt-connect';

class App extends Component {
  render() {
    return (
      <Provider cache={new CacheStore}>
        <Routes /> // or what have you
      </Provider>
    )
  }
}
```

**NOTE:** `CacheStore`'s interface must implement two methods:

1. `set(key, val)`
2. `get(key)`

And in your components throughout the app:

```JavaScript
import { connect } from 'tpt-connect';

class User extends Component {
  static propTypes = {
    userFetch: PropTypes.object.isRequired,
    userDelete: PropTypes.object.isRequired,
    userDeleteResponse: PropTypes.object // TODO: really all are instances of PromiseState
  };

  renderDeleteNotification() {
    return (
      <p>This user is deleted, brah.</p>
    )
  }

  render() {
    const {
      userFetch: {
        value: {
          data: user
        }
      },
      userDelete,
      userDeleteResponse
    } = this.props;

    return (
      <div>
        {userDeleteResponse && userDeleteResponse.fulfilled && this.renderDeleteNotification()}
        <h1>{user.name}</h1>
        <button onClick={() => { userDelete(user.id) }}>
          DELETE USER
        </button>
      </div>
    );
  }
}

exports default connect((props) => {
  return {

    userFetch: {
      url: `http://tpt.com/users/${props.userId}`,
      ttl: 1000 * 60 * 10, // time to keep cached in milliseconds (optional)
      type: Object, // the type that should be expected to get as the response (optional)
      default: { data: {} }, // default value until we get a response from the server (optional)
    },

    userDelete: (userId) => ({
      userDeleteResponse: {
        url: `http://tpt.com/users/${userId}`,
        type: Object,
        method: 'DELETE',
        headers: {
          Authorization: 'Basic user:pass'
        }
      }
    })

  };
})(UserLIst);
```

**NOTE:** The only attributes tpt-connect adds on top of React-Refetch are:

- `ttl` (Time to Live) - for how long should the request be cached in the store
  provided to `Provider`. If no value is given, the response will not be cached.
- `type` - sets the type to be expected the response to return. If a different
  response is returned, it `TypeError` will be thrown.
- `default` - default value to populate the property with until the response is
  returned. This helps avoid checking state of our promise.

For documentation on the rest of the attributes, check out
[React-Refetch](https://github.com/heroku/react-refetch).

