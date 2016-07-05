import { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect as reduxConnect } from 'react-redux';
import * as actions from '../actions';
import { fullUrl, findInState, normalizeResourceDefinition, extendFunction } from '../helpers';
import hoistStatics from 'hoist-non-react-statics';

export default function defineResources(mapStateToResources) {
  return (WrappedComponent) => {
    // if WrappedComponent is already wrapped in redux's connect, there is no
    // need to wrap again.
    const ReduxConnectComponent = WrappedComponent.name === 'Connect'
      ? WrappedComponent
      : reduxConnect(() => ({}))(WrappedComponent);

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

        // store reference to old definitions so we can check later if they
        // changed before making another request
        this.resources.forEach((resource) => {
          resource.definition._old = { ...resource.definition };
        });
      }

      componentDidUpdate() {
        this.loadResources(this.changedResources);
      }

      /**
       * Gets our resources from the previously computed stateProps
       */
      get resources() {
        return Object.keys(this.stateProps).reduce((resources, key) =>
          this.stateProps[key]._isTptConnect
            ? resources.concat(this.stateProps[key])
            : resources
        , []);
      }

      /**
       * @returns {array} resources that need to be fetched again (either the
       * requestKey changed, or they're now `auto` after being not)
       */
      get changedResources() {
        return this.resources.filter((resource) =>
          resource.definition.auto && !resource.definition._old.auto ||
          resource.definition._old.requestKey !== resource.definition.requestKey
        );
      }

      get serverResources() {
        return this.resources.filter((resource) => !resource.clientOnly);
      }

      loadResources(resources = []) {
        resources.forEach((resource) => {
          const definition = resource.definition;
          if (definition.auto && !findInState(this.store.getState(), definition)) {
            resource.prepopulate();
            resource.fetch();
          }
        });
      }

      updateOptions() {
        this.options = { ...this.props, ...(this.context.options || {}) };
      }

      updateDispatchers() {
        const { onSuccess, onError, onRequest } = this.options;

        const {
          invalidateResource,
          prepopulateResource,
          dispatchRequest
        } = bindActionCreators(actions, this.store.dispatch);

        this.invalidateResource = invalidateResource;

        this.prepopulateResource = prepopulateResource;

        // wrapping in a function returning a normal promise
        this.dispatchRequest = (definition) => {
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
       * Computes props from redux's original mapping function along merged w/
       * our mapping function.
       * @override
       */
      computeStateProps(store, props) {
        const stateProps = super.computeStateProps(store, props);
        const resourceProps = this.computeResourceStateProps(store, props);
        return { ...stateProps, ...resourceProps };
      }

      /**
       * Computes our resources. Only called when redux thinks state props
       * update is in order.
       */
      computeResourceStateProps(store, props) {
        const state = store.getState();
        const resourceDefinitions = mapStateToResources(state, props);

        return Object.keys(resourceDefinitions).reduce((normalizedResourceProps, key) => {
          const definition = normalizeResourceDefinition(resourceDefinitions[key]);

          const {
            meta = {},
            value = definition.defaultValue
          } = findInState(state, definition) || {};

          const resourceActions = Object.keys(definition.actions).reduce((_actions, actionKey) => {
            const originalAction = typeof definition.actions[actionKey] === 'function'
              ? definition.actions[actionKey]
              : () => definition.actions[actionKey];

            return {
              ..._actions,
              [actionKey]: (...args) => {
                const actionDefinition = { ...definition, ...originalAction(...args) };
                const url = fullUrl(actionDefinition.url, actionDefinition.params);
                return this.dispatchRequest({ ...actionDefinition, url });
              }
            };
          }, {});

          return {
            ...normalizedResourceProps,
            [key]: {
              _isTptConnect: true,
              definition,
              meta,
              value,
              invalidate: () => this.invalidateResource(definition),
              prepopulate: () => this.prepopulateResource(definition),
              fetch: () => this.dispatchRequest(definition),
              ...resourceActions
            }
          };
        }, {});
      }

      /**
       * @override
       */
      render() {
        const { isServer } = this.options;
        this.renderedElement = super.render();

        // componentDidMount isnt getting called on server render so needs to be
        // triggered once here
        if (isServer && this._isFirstRender) {
          this.loadResources(this.serverDefinitions); // only load non client-only resources
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
