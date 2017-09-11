import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import hoistStatics from 'hoist-non-react-statics';
import * as actions from '../actions';
import {
  fullUrl,
  isInState,
  findInState,
  normalizeResourceDefinition,
  extendFunction
} from '../helpers';

export default function defineResources(mapStateToResources) {
  return (WrappedComponent) => {
    // if WrappedComponent is already wrapped in redux's connect, there is no
    // need to wrap again.
    const isAlreadyWrappedInConnect = String(WrappedComponent.displayName).startsWith('Connect');

    const ReduxConnectComponent = isAlreadyWrappedInConnect
      ? WrappedComponent
      // eslint-disable-next-line global-require
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

        // our resource props we will eventually pass down to the rendered component
        this.resourceProps = {};

        // keep in array as well for easier access
        this.allResources = [];

        // the state props managed by redux
        this._reduxStateProps = {};

        this.updateOptionsIfNeeded();
      }

      componentWillMount() {
        const { isServer } = this.options;
        // gotta call it once before triggering fetch
        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded();
        // trigger fetch of all resources before first render (cant be in render
        // method since it triggers a setState on prepopulate)
        this.fetchResources(isServer ? this.serverResources : this.allResources);
      }

      componentDidUpdate() {
        this.fetchResources(this.changedResources);
      }

      fetchResources(resources) {
        resources.forEach((resource) => {
          const { definition } = resource;
          if (definition.auto && !isInState(this.state.storeState, definition)) {
            resource.prepopulate();
            resource.fetch().catch(() => {
              /* we dont expose the promise here, so we should probably catch
               * those rejections to prevent unhandled rejections */
            });
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

      /**
       * @override
       */
      updateStatePropsIfNeeded() {
        // reinstate reudx's stateProps here so we dont get false
        // `haveStatePropsChanged` when they havent
        this.stateProps = this._reduxStateProps;

        const haveStatePropsChanged = super.updateStatePropsIfNeeded();

        // keep ref to redux's stateProps
        this._reduxStateProps = this.stateProps;

        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded();

        // overwriting to include our resourceProps as well before redux renders
        this.stateProps = { ...this.stateProps, ...this.resourceProps };

        // if this is just a tpt-connect component, we can prevent triggering a
        // re-render if resourceProps stayed the same
        return this.haveResourcePropsChanged ||
          isAlreadyWrappedInConnect && haveStatePropsChanged;
      }

      // updating dispatching funcs is only necessary when options changed and
      // we need to bind new (anti-pattern...) callbacks
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
        const nextResourceProps = this.computeResourceProps();
        const resourceKeys = Object.keys(nextResourceProps);

        if (resourceKeys.every((k) =>
          this.resourceProps[k] && // new prop is currently defined
          !nextResourceProps[k].definition._isDirty && // new prop does not need to be fetched
          nextResourceProps[k].meta.lastUpdated === this.resourceProps[k].meta.lastUpdated // meta (+ value) did not change
        )) {
          return false;
        }

        this.resourceProps = nextResourceProps;

        this.allResources = resourceKeys.map((k) => this.resourceProps[k]);

        this.changedResources =
          this.allResources.filter(({ definition }) => definition._isDirty);

        this.serverResources =
          this.allResources.filter(({ definition }) => !definition.clientOnly);

        return true;
      }

      computeResourceProps() {
        const resourceDefinitions = mapStateToResources(this.state.storeState, {
          ...this.props,
          // extending props so we can access redux's new computed, stateProps
          // in our mapStateToResources func
          ...this._reduxStateProps
        });

        return Object.keys(resourceDefinitions).reduce((resourceProps, key) => {
          const oldResource = this.resourceProps[key] || {};
          const definition = normalizeResourceDefinition(resourceDefinitions[key]);

          // used to figure out if we should refetch our resource
          const _isDirty = !oldResource.definition || // new resource
            definition.auto && !oldResource.definition.auto || // auto prop changed from false to true
            definition.requestKey !== oldResource.definition.requestKey;

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
    }

    TptConnectComponent.displayName =
      `TptConnect(${WrappedComponent.displayName || WrappedComponent.name})`;

    TptConnectComponent.WrappedComponent = WrappedComponent;

    return hoistStatics(TptConnectComponent, WrappedComponent);
  };
}
