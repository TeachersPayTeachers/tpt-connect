import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react/lib/ReactTestUtils';
import { Provider, connect } from '../src';

const MINUTE = 10 * 60 * 1000;

const cache = (() => {
  let _store = {};
  return {
    set: (key, val) => { _store[key] = val; },
    get: (key) => (_store[key]),
    length: () => (Object.keys(_store).length),
    clear: () => { _store = {}; },
    options: { ttl: null }
  };
})();

class _Component extends Component {
  componentDidMount() {
    this.refs.me._props = this.props;
  }
  componentDidUpdate() {
    this.componentDidMount();
  }
  render() {
    return (<img ref="me" />);
  }
}

function renderComponent(mappingFunc) {
  const NewComponent = connect(mappingFunc)(_Component);
  const component = TestUtils.renderIntoDocument(
    <Provider cache={cache}>
      <NewComponent />
    </Provider>
  );

  return ReactDOM.findDOMNode(component);
}

// resolving promises seems to take a bit longer than "next tick"
function defer(func) {
  setTimeout(func, 100);
}

describe('tpt-connect', () => {
  beforeEach(() => {
    cache.clear();
    spyOn(window, 'fetch').and.callFake(() => {
      return Promise.resolve(new Response(JSON.stringify({
        date: new Date
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }));
    });
  });

  describe('GET requests', () => {
    it('retrieves data', () => {
      renderComponent(() => ({ users: 'http://url.com' }));
      expect(window.fetch.calls.count()).toEqual(1);
    });

    describe('when TTL is not given', () => {
      it('does not cache response', (done) => {
        renderComponent(() => ({
          users: {
            url: 'http://url.com'
          }
        }));
        defer(() => {
          expect(cache.length()).toEqual(0);
          done();
        });
      });
    });

    describe('when TTL is given', () => {
      it('caches response for TTL milliseconds', (done) => {
        renderComponent(() => ({
          users: {
            url: 'http://url.com',
            ttl: MINUTE
          }
        }));
        defer(() => {
          expect(cache.length()).toEqual(1);
          done();
        });
      });
    });

    describe('when there is a valid cache', () => {
      it('returns the cached data w/out making request', (done) => {
        const oldComp = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            ttl: MINUTE
          }
        }));
        defer(() => {
          const newComp = renderComponent(() => ({
            users: {
              url: 'http://url.com',
              ttl: MINUTE
            }
          }));
          expect(window.fetch.calls.count()).toEqual(1);
          defer(() => {
            expect(newComp._props.users.value).toEqual(oldComp._props.users.value);
            done();
          });
        });
      });
    });

    describe('when there isnt a valid cached response', () => {
      it('makes a request to server', (done) => {
        renderComponent(() => ({ users: 'http://url.com' }));
        defer(() => {
          renderComponent(() => ({ users: 'http://url.com' }));
          expect(window.fetch.calls.count()).toEqual(2);
          done();
        });
      });
    });

    describe('when default value is given', () => {
      it('provides default value until request finished', () => {
        const defaultValue = { default: 'value' };
        const component = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            default: defaultValue
          }
        }));
        expect(component._props.users.value).toEqual(defaultValue);
      });
    });

    describe('when type is given', () => {
      it('validates the response is of type', (done) => {
        spyOn(console, 'error');
        renderComponent(() => ({
          users: {
            url: 'http://url.com',
            type: String
          }
        }));
        defer(() => {
          expect(console.error).toHaveBeenCalled();
          done();
        });
      });

      it('sets the default value to empty of `type` if default value isnt provided', () => {
        const component = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            type: Object
          }
        }));
        expect(component._props.users.value).toEqual({});
      });
    });
  });

  describe('POST requests', () => {
    it('retrieves data', () => {
      renderComponent(() => ({
        users: {
          url: 'http://url.com',
          method: 'POST'
        }
      }));
      expect(window.fetch.calls.count()).toEqual(1);
    });

    describe('when TTL is given', () => {
      it('still does NOT cache the response', (done) => {
        renderComponent(() => ({
          users: {
            url: 'http://url.com',
            method: 'POST',
            ttl: MINUTE
          }
        }));
        defer(() => {
          expect(cache.length()).toEqual(0);
          done();
        });
      });
    });
  });
});
