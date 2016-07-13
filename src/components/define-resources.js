import { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import * as actions from '../actions';
import { normalizeResourceDefinition, findInState, extendFunction } from '../helpers';
import hoistStatics from 'hoist-non-react-statics';
import TptConnectResource from '../lib/TptConnectResource';

export default function defineResources(mapStateToResources) {
  return (WrappedComponent) => {
    // if WrappedComponent is already wrapped in redux's connect, there is no
    // need to wrap again.
    const ReduxConnectComponent = WrappedComponent.name === 'Connect'
      ? WrappedComponent
      : require('react-redux').connect(() => ({}))(WrappedComponent);

    class TptConnectComponent extends ReduxConnectComponent {
      static contextTypes = {
        ...ReduxConnectComponent.contextTypes,
        options: PropTypes.object
      };

      /**
       * @override
       */
      constructor(...args) {
        super(...args);
        this.updateOptions();
        this.updateDispatchers();
        this.resources = [];
        this._isFirstRender = true;
      }

      /**
       * @override
       */
      componentDidMount() {
        super.componentDidMount();
        this.loadResources(this.resources);
      }

      /**
       * @override
       */
      componentWillReceiveProps(...args) {
        super.componentWillReceiveProps(...args);

        if (this.haveOwnPropsChanged) {
          this.updateOptions();
          this.updateDispatchers();
        }
      }

      componentDidUpdate() {
        this.loadResources(this.changedResources);
      }

      /**
       * @returns {array} resources that need to be fetched again (either the
       * requestKey changed, or they're now `auto` after being not)
       */
      get changedResources() {
        return this.resources.filter((resource) => resource.meta._isDirty);
      }

      get serverResources() {
        return this.resources.filter((resource) => !resource.definition.clientOnly);
      }

      loadResources(resources) {
        resources.forEach((resource) => {
          const definition = resource.definition;
          if (definition.auto && !findInState(this.store.getState(), definition)) {
            resource.prepopulate();
            // avoid debouncing on first render's fetch
            if (resource.meta._isDirty && definition.debounce !== undefined) {
              clearTimeout(resource.meta._timerId);
              resource.meta._timerId = setTimeout(() => {
                resource.fetch();
              }, definition.debounce);
            } else {
              resource.fetch();
            }
          }
        });
      }

      // TODO: should get only relevant keys from props
      updateOptions() {
        this.options = { ...(this.context.options || {}), ...this.props };
      }

      updateDispatchers() {
        const { onSuccess, onError, onRequest } = this.options;

        const { dispatchRequest } = this.dispatchers =
          bindActionCreators(actions, this.store.dispatch);

        // wrapping in a function returning a normal promise
        this.dispatchers.dispatchRequest = (definition) => {
          const promise = new Promise((resolve, reject) => {
            dispatchRequest(definition, {
              onSuccess: extendFunction(onSuccess, resolve),
              onError: extendFunction(onError, reject)
            });
          });
          onRequest && onRequest(promise);
          return promise;
        };
      }

      /**
       * Computes props from redux's original mapping function merged w/ our
       * mapping function.
       * @override
       */
      computeStateProps(store, props) {
        const stateProps = super.computeStateProps(store, props);
        const resourceProps = this.computeResourceProps(store, props);
        this.resources = Object.keys(resourceProps).map((k) => resourceProps[k]);
        return { ...stateProps, ...resourceProps };
      }

      /**
       * Computes our resources. Only called when redux thinks state props
       * update is in order.
       */
      computeResourceProps(store, props) {
        const state = store.getState();
        const resourceDefinitions = mapStateToResources(state, props);
        const stateProps = this.stateProps || {};

        return Object.keys(resourceDefinitions).reduce((resourceProps, key) => {
          const definition = normalizeResourceDefinition(resourceDefinitions[key]);
          const old = stateProps[key];
          const current = { definition, ...(findInState(state, definition) || {}) };

          return {
            ...resourceProps,
            [key]: new TptConnectResource(current, old, this.dispatchers)
          };
        }, {});
      }

      /**
       * @override
       */
      render() {
        const { isServer } = this.options;
        this.renderedElement = super.render();

        // componentDidMount isnt getting called on server
        if (isServer && this._isFirstRender) {
          this.loadResources(this.serverResources);
          this._isFirstRender = false;
        }

        return this.renderedElement;
      }
    }

    TptConnectComponent.displayName =
      `TptConnect(${WrappedComponent.displayName || WrappedComponent.name})`;

    TptConnectComponent.WrappedComponent = WrappedComponent;

    return hoistStatics(TptConnectComponent, WrappedComponent);
  };
}
