import React, { Component } from 'react';
import { connect } from 'react-redux';
import { logger } from '../helpers';

export default function defineResources(mapStateToResources) {

  /**
   * @param {Object} state - redux state
   * @param {Object} ownProps - component's original props
   *
   * @returns {Object} - props to be passed down to TptConnectedComponent
   */
  function finalMapStateToResources(state, ownProps) {
    const resourceDefinitions = mapStateToResources(state, ownProps)

    const resources = Object.keys(resourceDefinitions).reduce((resourceProps, key) => {
      const oldResource = this.resourceProps[key] || {};
      const definition = normalizeResourceDefinition(resourceDefinitions[key]);

      // used to figure out if we should refetch our resource
      const _isDirty =
        // new resource
        !oldResource.definition ||
        // auto prop changed from false to true
        definition.auto && !oldResource.definition.auto ||
        definition.requestKey !== oldResource.definition.requestKey;

      const {
        meta = {},
        value = definition.defaultValue
      } = findInState(state, definition) || oldResource;

      return {
        ...resourceProps,
        [key]: {
          definition: {
            ...definition,
            _isDirty
          },
          meta,
          value,
          invalidate: () => invalidateResource(definition),
          prepopulate: () => prepopulateResource(definition),
          fetch: () => dispatchRequest(definition),
          ...computeResourceActions(definition)
        }
      };
    }, {});

    return { __tptConnectResources: resources };
  }

  return (WrappedComponent) => {
    @connect(finalMapStateToResources)
    class TptConnectedComponent extends Component {
      static contextTypes = {
        options: PropTypes.shape({
          onRequest: PropTypes.func,
          onSucess: PropTypes.func,
          onError: PropTypes.func,
          isServer: PropTypes.bool
        })
      };

      /**
       * our resource props we will eventually pass down to the rendered
       * component
       */
      resourceProps = {};

      /**
       * keep in array as well for easier access
       */
      allResources = [];

      componentWillMount() {
        this.updateOptionsIfNeeded(this.props);

        const { isServer } = this.options;
        // gotta call it once before triggering fetch
        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded(this.props);
        // trigger fetch of all resources before first render (cant be in render
        // method since it triggers a setState on prepopulate)
        this.fetchResourcesIfNeeded(isServer ? this.serverResources : this.allResources);
      }

      componentWillReceiveProps(nextProps) {
        this.updateOptionsIfNeeded(nextProps);
        this.haveResourcePropsChanged = this.updateResourcePropsIfNeeded(nextProps);
        this.fetchResourcesIfNeeded(this.changedResources);
      }

      /**
       * Update global options (isServer, onRequest, onSuccess, onError) when
       * the component's props or the context changed
       */
      updateOptionsIfNeeded(props) {
        const { isServer, onRequest, onSuccess, onError } = props;
        const newOptions = {
          ...this.context.options,
          isServer,
          onRequest,
          onSuccess,
          onError
        };

        // TODO: check if actually changed here and return false if not
        this.options = newOptions;
        this.updateDispatchers();

        return true;
      }

      updateResourcePropsIfNeeded(props) {
        const nextResourceProps = props.__tptConnectResources;
        const resourceKeys = Object.keys(nextResourceProps);

        if (resourceKeys.every((k) =>
          // new prop is currently defined
          this.resourceProps[k] &&
          // new prop does not need to be fetched
          !nextResourceProps[k].definition._isDirty &&
          // meta (+ value) did not change
          nextResourceProps[k].meta.lastUpdated === this.resourceProps[k].meta.lastUpdated
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

      /**
       * @param {Array.<Object>} resources
       */
      fetchResourcesIfNeeded(resources) {
        resources.forEach((resource) => {
          const { definition } = resource;
          if (definition.auto && !isInState(this.state.storeState, definition)) {
            resource.prepopulate();
            resource.fetch().catch((e) => {
              logger.error(`Failed to fetch ${resource} with Error: ${e}`);
            });
          }
        });
      }


      /**
       * updating dispatching funcs is only necessary when options changed and
       * we need to bind new callbacks
       */
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
              // TODO: compose?
              onSuccess: extendFunction(onSuccess, resolve),
              onError: extendFunction(onError, reject)
            });
          });
          onRequest && onRequest(promise);
          return promise;
        };
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

    return TptConnectedComponent;
  };
}
