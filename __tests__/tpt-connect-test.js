import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react/lib/ReactTestUtils';
import { Provider, connect } from '../src';

const MINUTE = 60 * 1000;

class _Component extends Component {
  componentDidMount() {
    this.exposeProps();
  }
  componentDidUpdate() {
    this.exposeProps();
  }
  exposeProps() { // TODO: is there a better way?
    this.refs.me._props = this.props;
  }
  render() {
    return (<img ref="me" />);
  }
}

let _store = {};

function renderComponent(mappingFunc) {
  const NewComponent = connect(mappingFunc)(_Component);
  const provider = TestUtils.renderIntoDocument(
    <Provider store={_store}>
      <NewComponent />
    </Provider>
  );

  return { provider, domElement: ReactDOM.findDOMNode(provider) };
}

// TODO: resolving promises seems to take a bit longer than "next tick"
// also browser is so incosistent with this. need to just invoke expectations
// after promise resolves
function defer(func) {
  setTimeout(func, 100);
}

describe('tpt-connect', () => {
  beforeEach(() => {
    _store = {};
    spyOn(window, 'fetch').and.callFake(() => {
      return Promise.resolve(new Response(JSON.stringify({
        date: new Date
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }));
    });
  });

  describe('GET request', () => {
    it('retrieves data', () => {
      renderComponent(() => ({ users: 'http://url.com' }));
      expect(window.fetch.calls.count()).toEqual(1);
    });

    describe('when TTL is not given', () => {
      it('still caches promise (as other components may need it)', () => {
        const { provider: { cache } } = renderComponent(() => ({ users: 'http://url.com' }));
        expect(cache.length).toEqual(1);
      });

      it('doesnt return the cached promise', () => {
        const mappingFunc = () => ({ users: 'http://url.com' });
        const { domElement } = renderComponent(mappingFunc);
        defer(() => {
          expect(domElement._props.users.value)
            .not.toEqual(renderComponent(mappingFunc).domElement._props.users.value);
        });
      });
    });

    describe('when TTL is given', () => {
      it('caches response for TTL milliseconds', () => {
        const { provider: { cache } } = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            ttl: MINUTE
          }
        }));
        expect(cache.length).toEqual(1);
      });
    });

    describe('when there is a valid cache', () => {
      it('returns the cached data w/out making additional request', (done) => {
        const { domElement: oldComp } = renderComponent(() => ({ users: 'http://url.com' }));
        const { domElement: newComp } = renderComponent(() => ({
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

      describe('when the url is not normalized', () => {
        it('still returns the cached promise', () => {
          [
            'HTTP://urL.COM',
            'http://www.url.com',
            'http://url.com/',
            'http://url.com?',
            'url.com/?'
          ].forEach((url) => renderComponent(() => ({ users: { url, ttl: MINUTE } })));
          expect(window.fetch.calls.count()).toEqual(1);
        });
      });

      describe('when the headers are ordered differently', () => {
        it('still returns the cached promise', () => {
          [
            { 'Content-Type': 'application/json', Accept: 'application/json' },
            { Accept: 'application/json', 'Content-Type': 'application/json' }
          ].forEach((headers) => renderComponent(() => ({
            users: {
              url: 'http://url.com',
              headers,
              ttl: MINUTE
            }
          })));
          expect(window.fetch.calls.count()).toEqual(1);
        });
      });
    });

    describe('when there isnt a valid cached promise', () => {
      describe('when the url is different', () => {
        it('makes all requests to server', () => {
          ['http://url.com', 'http://url2.com'].forEach((url) => {
            renderComponent(() => ({ users: url }));
          });
          expect(window.fetch.calls.count()).toEqual(2);
        });
      });

      describe('when the url is the same but headers are different', () => {
        it('makes all requests to server', () => {
          [{ 'X-Secret': 'Shhh' }, { 'X-Secret': 'blah' }].forEach((headers) => {
            renderComponent(() => ({ users: { headers, url: 'http://url.com' } }));
          });
          expect(window.fetch.calls.count()).toEqual(2);
        });
      });
    });

    describe('when default value is given', () => {
      it('provides default value until request finished', () => {
        const defaultValue = { default: 'value' };
        const { domElement } = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            default: defaultValue
          }
        }));
        expect(domElement._props.users.value).toEqual(defaultValue);
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
        const { domElement } = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            type: Object
          }
        }));
        expect(domElement._props.users.value).toEqual({});
      });
    });
  });

  describe('POST request', () => {
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
      it('still does NOT cache the promise', () => {
        const { provider: { cache } } = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            method: 'POST',
            ttl: MINUTE
          }
        }));
        expect(cache.length).toEqual(0);
      });
    });
  });
});
