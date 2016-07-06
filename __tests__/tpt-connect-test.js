import './support/fetch-mock.js';
import 'babel-polyfill';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react/lib/ReactTestUtils';
import { Provider } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import {
  defineResources,
  Schema,
  arrayOf,
  connectReducer,
  connectMiddleware,
  ConnectProvider
} from '../src';

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

const userSchema = new Schema('user');
const resourceDefinition = {
  schema: userSchema,
  url: 'http://tpt.com/id'
};

let store;
let provider;
let domElement;

function defer(func) {
  setTimeout(func, 100);
}

function renderComponent(mappingFunc) {
  mappingFunc || (mappingFunc = () => ({
    user: resourceDefinition
  }));

  const NewComponent = defineResources(mappingFunc)(_Component);
  provider = TestUtils.renderIntoDocument(
    <Provider store={store}>
      <NewComponent />
    </Provider>
  );
  domElement = ReactDOM.findDOMNode(provider);
}

describe('tpt-connect', () => {
  beforeEach(() => {
    store = createStore(
      combineReducers({ connect: connectReducer }),
      applyMiddleware(connectMiddleware({}))
    );
    window.fetch.calls.reset();
    window.fetch.and.callFake(() => {
      return Promise.resolve(new Response(JSON.stringify({
        id: 3,
        date: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }));
    });
  });

  // TODO: add test cases for when resource is not indexable (no key)

  it('creates its own store when not provided one', () => {
    provider = TestUtils.renderIntoDocument(
      <ConnectProvider>
        <_Component/>
      </ConnectProvider>
    );
    expect(provider._reactInternalInstance._instance.state.store).toEqual(jasmine.any(Object));
  });

  it('reuses the store its provided with', () => {
    provider = TestUtils.renderIntoDocument(
      <ConnectProvider store={store}>
        <_Component/>
      </ConnectProvider>
    );
    expect(provider._reactInternalInstance._instance.state.store).toEqual(store);
  });

  it('populates the prop with a default value', () => {
    renderComponent();
    expect(domElement._props.user).toEqual(jasmine.any(Object));
  });

  it('completes the resource definition with its resource defaults', () => {
    renderComponent();
    expect(domElement._props.user.definition.method).toEqual('GET');
  });

  it('does not intervene with normal Redux functionality', (done) => {
    const spyReducer = jasmine.createSpy().and.callFake((state = {}) => (state));
    store = createStore(
      combineReducers({ reducer: spyReducer, connect: connectReducer }),
      applyMiddleware(connectMiddleware({}))
    );
    renderComponent();
    defer(() => {
      expect(spyReducer).toHaveBeenCalled();
      done();
    });
  });

  describe('GET requests', () => {
    describe('when server returned an error', () => {
      beforeEach(() => {
        window.fetch.and.callFake(() => {
          return Promise.resolve(new Response(JSON.stringify({
            id: 3,
            error: 'This is an error'
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 404
          }));
        });
      });

      it('sets the meta.isError flag to true', (done) => {
        renderComponent();
        defer(() => {
          expect(domElement._props.user.meta.isError).toBe(true);
          done();
        });
      });

      it('returns the error instead of the resource', (done) => {
        renderComponent();
        defer(() => {
          expect(domElement._props.user.value.error).toEqual('This is an error');
          done();
        });
      });
    });

    describe('when data is in state', () => {
      describe('NOT stale', () => {
        it('retrieves the data from state', (done) => {
          renderComponent();
          renderComponent();
          defer(() => {
            expect(window.fetch.calls.count()).toEqual(1);
            done();
          });
        });

        it('sends another request if used the `fetch` method', (done) => {
          renderComponent();
          domElement._props.user.fetch();
          defer(() => {
            expect(window.fetch.calls.count()).toEqual(2);
            done();
          });
        });

        // TODO: this fails because we're not stripping WWW anymore (see helpers.fullUrl)
        describe('when the url is not normalized', () => {
          it('still returns the stored data', (done) => {
            [
              'http://url.com',
              'http://www.url.com',
              'http://url.com/',
              'http://url.com?',
              'http://url.com//',
              'url.com/?'
            ].forEach((url) => {
              renderComponent(() => ({
                users: {
                  url,
                  schema: arrayOf(userSchema)
                }
              }));
            });
            defer(() => {
              expect(window.fetch.calls.count()).toEqual(1);
              done();
            });
          });
        });

        describe('when the headers are ordered differently', () => {
          it('still returns the stored data', (done) => {
            [
              { 'Content-Type': 'application/json', Accept: 'application/json' },
              { Accept: 'application/json', 'Content-Type': 'application/json' }
            ].forEach((headers) => {
              renderComponent(() => ({
                users: {
                  url: 'http://url.com',
                  headers,
                  schema: arrayOf(userSchema)
                }
              }));
            });
            defer(() => {
              expect(window.fetch.calls.count()).toEqual(1);
              done();
            });
          });
        });
      });
    });

    describe('when data is NOT in state', () => {
      it('refetches it', (done) => {
        renderComponent(() => ({ item: { url: 'tpt.com/item', schema: new Schema('item') } }));
        renderComponent();
        defer(() => {
          expect(window.fetch.calls.count()).toEqual(2);
          done();
        });
      });

      it('stores in state', (done) => {
        renderComponent();
        defer(() => {
          const state = provider.props.store.getState().connect;
          expect(Object.keys(state.paramsToResources).length).toEqual(1);
          expect(Object.keys(state.resources.user).length).toEqual(1);
          done();
        });
      });

      it('fires the request automatically when mounted', (done) => {
        renderComponent();
        defer(() => {
          expect(window.fetch.calls.count()).toEqual(1);
          done();
        });
      });

      it('fires the request automatically when relevant props change', (done) => {
        const mapFunc = (state) => {
          return {
            users: {
              schema: arrayOf(userSchema),
              url: 'http://tpt.com/users',
              params: { query: state.routing.query }
            }
          };
        };

        store = createStore(
          combineReducers({ connect: connectReducer, routing: (state = {}, action) => {
            return action.type === 'query change'
              ? { ...action, ...state }
              : state;
          } }),
          applyMiddleware(connectMiddleware({}))
        );

        renderComponent(mapFunc);

        defer(() => {
          provider.store.dispatch({
            type: 'query change',
            query: 'blah blah'
          });

          defer(() => { // TODO
            expect(window.fetch.calls.count()).toEqual(2);
            done();
          });
        });
      });

      describe('when the url is the same but headers are different', () => {
        it('makes all requests to server', (done) => {
          [
            { 'X-Secret': 'Shhh' },
            { 'X-Secret': 'blah' },
            { 'X-Secret': 'blah' },
            { 'X-Secre': 'tblah' }
          ].forEach((headers) => {
            renderComponent(() => ({
              users: {
                headers,
                url: 'http://url.com',
                schema: arrayOf(userSchema)
              }
            }));
          });
          defer(() => {
            expect(window.fetch.calls.count()).toEqual(3);
            done();
          });
        });
      });
    });
  });

  describe('POST requests', () => {
    const usersDefinition = {
      schema: userSchema,
      url: 'http://tpt.com/users',
      method: 'POST',
      payload: JSON.stringify({ user: { name: 'foo' } })
    };

    describe('when data is NOT in state', () => {
      it('does not fire automatically', (done) => {
        renderComponent(() => ({
          users: usersDefinition
        }));
        defer(() => {
          expect(window.fetch.calls.count()).toEqual(0);
          done();
        });
      });

      it('does not store returned resource automatically', (done) => {
        renderComponent(() => ({
          users: usersDefinition
        }));
        domElement._props.users.fetch();
        defer(() => {
          expect(window.fetch.calls.count()).toEqual(1);
          const state = provider.props.store.getState().connect;
          expect(state.resources).toBe(undefined);
          expect(Object.keys(state.paramsToResources).length).toEqual(0);
          done();
        });
      });
    });
  });

  describe('Global options', () => {
    const spyFunc = jasmine.createSpy();
    const mappingFunc = () => ({ users: { ...resourceDefinition } });

    beforeEach(() => {
      spyFunc.calls.reset();
      const _NewComponent = defineResources(mappingFunc)(_Component);
      provider = TestUtils.renderIntoDocument(
        <ConnectProvider onSuccess={spyFunc}>
          <_NewComponent />
        </ConnectProvider>
      );
      domElement = ReactDOM.findDOMNode(provider);
    });

    it('executes functions passed in directly to dispatchRequest AND global funcs', (done) => {
      domElement._props.users.fetch().then(spyFunc);
      defer(() => {
        expect(spyFunc.calls.count()).toEqual(3);
        done();
      });
    });

    it('executes functions passed in as props to Provider', (done) => {
      defer(() => {
        expect(spyFunc.calls.count()).toEqual(1);
        done();
      });
    });
  });
});
