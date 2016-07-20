import { PropTypes, cloneElement } from 'react';
import { bindActionCreators } from 'redux';
import * as actions from '../actions';
import { fullUrl, findInState, normalizeResourceDefinition, extendFunction } from '../helpers';
import hoistStatics from 'hoist-non-react-statics';

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

      constructor(...args) {
        super(...args);
        this.resourceProps = {};
        this.allResources = [];
        this.updateOptionsIfNeeded();
      }

      componentWillReceiveProps(...args) {
        super.componentWillReceiveProps(...args);
        this.updateOptionsIfNeeded();
      }

      componentWillMount() {
        const { isServer } = this.options;
        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded();
        this.fetchResources(isServer ? this.serverResources : this.allResources);
      }

      componentWillUpdate() {
        super.componentWillUpdate && super.componentWillUpdate();
        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded();
        this.fetchResources(this.changedResources);
      }

      componentDidUpdate() {
        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded();
        this.fetchResources(this.changedResources);
      }

      fetchResources(resources) {
        resources.forEach((resource) => {
          const definition = resource.definition;
          if (definition.auto && !findInState(this.state.storeState, definition)) {
            resource.prepopulate();
            if (definition.debounce !== undefined) {
              clearTimeout(resource.definition._timerId);
              resource.definition._timerId = setTimeout(() => {
                resource.fetch();
              }, definition.debounce);
            } else {
              resource.fetch();
            }
          }
        });
      }

      updateOptionsIfNeeded() {
        if (!this.haveOwnPropsChanged) { return false; }
        const { isServer, onRequest, onSuccess, onError } = this.props;
        this.options = { isServer, onRequest, onSuccess, onError, ...this.context.options };
        this.updateDispatchers();
        return true;
      }

      updateDispatchers() {
        const { onSuccess, onError, onRequest } = this.options;

        const {
          invalidateResource,
          prepopulateResource,
          dispatchRequest
        } = bindActionCreators(actions, this.store.dispatch);

        // TODO no need to update these two
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

      updateResourcePropsIfNeeded() {
        if (!(this.haveOwnPropsChanged || this.hasStoreStateChanged)) { return false; }

        this.resourceProps = this.computeResourceProps();

        this.allResources = Object.keys(this.resourceProps).map((k) => this.resourceProps[k]);

        this.changedResources =
          this.allResources.filter(({ definition }) => definition._isDirty);

        this.serverResources =
          this.allResources.filter(({ definition }) => !definition.clientOnly);

        return true;
      }

      computeResourceProps() {
        const resourceDefinitions = mapStateToResources(this.state.storeState, this.props);
        return Object.keys(resourceDefinitions).reduce((resourceProps, key) => {
          const oldResource = this.resourceProps[key] || {};
          const definition = normalizeResourceDefinition(resourceDefinitions[key]);

          // used to figure out if we should refetch our resource
          const _isDirty = oldResource.definition &&
            (definition.auto && !oldResource.definition.auto ||
            definition.requestKey !== oldResource.definition.requestKey);

          const {
            meta = {},
            value = definition.defaultValue
          } = findInState(this.state.storeState, definition) || oldResource;

          return {
            ...resourceProps,
            [key]: {
              definition: {
                ...definition,
                _isDirty,
                _timerId: oldResource.definition && oldResource.definition._timerId
              },
              meta,
              value,
              invalidate: () => this.invalidateResource(definition),
              prepopulate: () => this.prepopulateResource(definition),
              fetch: () => this.dispatchRequest(definition),
              ...this.computeResourceActions(definition)
            }
          };
        }, {});
      }

      computeResourceActions(resourceDefinition) {
        const { actions: resourceActions } = resourceDefinition;
        return Object.keys(resourceActions).reduce((_actions, actionKey) => {
          const action = typeof resourceActions[actionKey] === 'function'
            ? resourceActions[actionKey]
            : () => resourceActions[actionKey];

          return {
            ..._actions,
            [actionKey]: (...args) => {
              const actionDefinition = {
                ...resourceDefinition,
                updateStrategy: false,
                refetchAfter: false,
                ...action(...args)
              };
              const { refetchAfter } = actionDefinition;
              const url = fullUrl(actionDefinition.url, actionDefinition.params);
              // TODO:
              return new Promise((resolve, reject) => {
                return this.dispatchRequest({ ...actionDefinition, url }).then((..._args) => {
                  if (refetchAfter === 'success' || refetchAfter === true) {
                    this.dispatchRequest(resourceDefinition);
                  }
                  return resolve(..._args);
                }).catch((..._args) => {
                  if (refetchAfter === 'error' || refetchAfter === true) {
                    this.dispatchRequest(resourceDefinition);
                  }
                  return reject(..._args);
                });
              });
            }
          };
        }, {});
      }

      /**
       * @override
       */
      render() {
        const haveOwnPropsChanged = this.haveOwnPropsChanged; // redux render clears it
        const hasStoreStateChanged = this.hasStoreStateChanged;

        this.renderedElement = super.render();

        this.haveOwnPropsChanged = haveOwnPropsChanged;
        this.hasStoreStateChanged = hasStoreStateChanged;

        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded();

        if (this.haveResourcePropsChanged) {
          this.renderedElement = cloneElement(this.renderedElement, this.resourceProps);
        }

        this.haveResourcePropsChanged = false;
        this.haveOwnPropsChanged = false;
        this.hasStoreStateChanged = false;

        return this.renderedElement;
      }
    }

    TptConnectComponent.displayName =
      `TptConnect(${WrappedComponent.displayName || WrappedComponent.name})`;

    TptConnectComponent.WrappedComponent = WrappedComponent;

    return hoistStatics(TptConnectComponent, WrappedComponent);
  };
}
