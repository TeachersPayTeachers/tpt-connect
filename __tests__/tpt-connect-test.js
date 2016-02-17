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

let _state = {};

function renderComponent(mappingFunc) {
  const NewComponent = connect(mappingFunc)(_Component);
  const provider = TestUtils.renderIntoDocument(
    <Provider state={_state}>
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
    _state = {};
    spyOn(window, 'fetch').and.callFake(() => {
      return Promise.resolve(new Response(JSON.stringify({
        date: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }));
    });
  });

  describe('Store', () => {
    it('dumps data as stringified json', () => {
      const { provider: { store } } = renderComponent(() => ({ users: 'http://url.com' }));
      expect(JSON.parse(store.dump())).toEqual(jasmine.any(String));
    });
  });

  describe('GET request', () => {
    it('retrieves data', () => {
      renderComponent(() => ({ users: 'http://url.com' }));
      expect(window.fetch.calls.count()).toEqual(1);
    });

    describe('when TTL is not given', () => {
      it('still stores promise (as other components may need it)', () => {
        const { provider: { store } } = renderComponent(() => ({ users: 'http://url.com' }));
        expect(store.length).toEqual(1);
      });

      it('doesnt return the stored promise', () => {
        const mappingFunc = () => ({ users: 'http://url.com' });
        const { domElement } = renderComponent(mappingFunc);
        defer(() => {
          expect(domElement._props.users.value)
            .not.toEqual(renderComponent(mappingFunc).domElement._props.users.value);
        });
      });
    });

    describe('when TTL is given', () => {
      it('stores response for TTL milliseconds', () => {
        const { provider: { store } } = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            ttl: MINUTE
          }
        }));
        expect(store.length).toEqual(1);
      });
    });

    describe('when there is a valid store', () => {
      it('returns the stored data w/out making additional request', (done) => {
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
        it('still returns the stored promise', () => {
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
        it('still returns the stored promise', () => {
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

    describe('when there isnt a valid stored promise', () => {
      describe('when the url is different', () => {
        it('makes all requests to server', () => {
          ['http://url.com', 'http://url2.com'].forEach((url) => {
            renderComponent(() => ({ users: { url, ttl: MINUTE } }));
          });
          expect(window.fetch.calls.count()).toEqual(2);
        });
      });

      describe('when the url is the same but headers are different', () => {
        it('makes all requests to server', () => {
          [
            { 'X-Secret': 'Shhh' },
            { 'X-Secret': 'blah' },
            { 'X-Secret': 'blah' },
            { 'X-Secre': 'tblah' }
          ].forEach((headers) => {
            renderComponent(() => ({ users: { headers, url: 'http://url.com', ttl: MINUTE } }));
          });
          expect(window.fetch.calls.count()).toEqual(3);
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
      it('still does NOT store the promise', () => {
        const { provider: { store } } = renderComponent(() => ({
          users: {
            url: 'http://url.com',
            method: 'POST',
            ttl: MINUTE
          }
        }));
        expect(store.length).toEqual(0);
      });
    });
  });
});
