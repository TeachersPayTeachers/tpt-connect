import { PropTypes } from 'react';
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

      /**
       * @override
       */
      constructor(...args) {
        super(...args);
        this.resourceProps = {};
        this.allResources = [];
        this.updateOptionsIfNeeded();
      }

      componentWillMount() {
        const { isServer } = this.options;
        // gotta call it once before triggering fetch
        this.haveResourcePropsChanged = this.updateResourceProps();
        // trigger fetch of all resources before first render (cant be in render
        // method since it triggers a setState on prepopulate)
        this.fetchResources(isServer ? this.serverResources : this.allResources);
      }

      componentDidUpdate() {
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

      // TODO: change to only update if needed (when either resource definition
      // or resource value/meta have changed)
      updateResourceProps() {
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
              return this.dispatchRequest({ ...actionDefinition, url }).then((response) => {
                if (refetchAfter === 'success' || refetchAfter === true) {
                  this.dispatchRequest(resourceDefinition);
                }
                return Promise.resolve(response);
              }).catch((err) => {
                if (refetchAfter === 'error' || refetchAfter === true) {
                  this.dispatchRequest(resourceDefinition);
                }
                return Promise.reject(err);
              });
            }
          };
        }, {});
      }

      /**
       * @override
       */
      updateMergedPropsIfNeeded() {
        const haveUpdated = super.updateMergedPropsIfNeeded();
        if (this.haveResourcePropsChanged) {
          this.mergedProps = { ...this.mergedProps, ...this.resourceProps };
        }
        return haveUpdated || this.haveResourcePropsChanged;
      }

      /**
       * @override
       */
      render() {
        if (this.haveOwnPropsChanged || this.hasStoreStateChanged) {
          this.haveResourcePropsChanged = this.updateResourceProps();
        }

        // overwriting so redux will call updateMergedPropsIfNeeded when our
        // resourceProps have changed
        this.haveOwnPropsChanged =
          this.haveOwnPropsChanged || this.haveResourcePropsChanged;

        return super.render();
      }
    }

    TptConnectComponent.displayName =
      `TptConnect(${WrappedComponent.displayName || WrappedComponent.name})`;

    TptConnectComponent.WrappedComponent = WrappedComponent;

    return hoistStatics(TptConnectComponent, WrappedComponent);
  };
}
