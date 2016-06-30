import { PropTypes, createElement } from 'react';
import { connect as reduxConnect } from 'react-redux';
import { invalidateResource, prepopulateResource, dispatchRequest } from '../actions';
import { fullUrl, findInState, normalizeResourceDefinition, extendFunction } from '../helpers';
import hoistStatics from 'hoist-non-react-statics';

function normalizeMap(resourceDefinitions, state) {
  Object.keys(resourceDefinitions).forEach((key) => {
    const definition = normalizeResourceDefinition(resourceDefinitions[key]);

    // populate our props with return value from store or defaults
    const {
      meta = {},
      value = definition.defaultValue
    } = findInState(state, definition) || {};

    resourceDefinitions[key] = {
      meta,
      value,
      definition,
      actions: { ...definition.actions }
    };
  });

  return {
    tptConnect: resourceDefinitions
  };
}

export default function defineResources(mapStateToProps) {
  // called every time the store updates
  const finalMapStateToProps = (state, ownProps) => {
    const originalMap = mapStateToProps(state, ownProps);
    return normalizeMap(originalMap, state);
  };

  return (WrappedComponent) => {
    // TODO: what if comp is already wrapped in redux's connect?
    // can we unwrap it and just add its args here?
    const ReduxConnect = reduxConnect(finalMapStateToProps, {
      dispatchRequest,
      prepopulateResource,
      invalidateResource
    })(WrappedComponent);

    class TptConnectComponent extends ReduxConnect {
      static contextTypes = {
        ...ReduxConnect.contextTypes,
        options: PropTypes.object
      };

      constructor(...args) {
        super(...args);
        this._isFirstRender = true;
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

      componentDidMount() {
        super.componentDidMount();
        this.loadResources(this.resources);
      }

      componentWillReceiveProps(...args) {
        super.componentWillReceiveProps(...args);
        this.resources.forEach((resource) => {
          resource.definition._old = { ...resource.definition };
        });
      }

      componentDidUpdate() {
        this.loadResources(this.changedResources);
      }

      get changedResources() {
        return this.resources.filter((resource) =>
          resource.definition.auto && !resource.definition._old.auto ||
          resource.definition._old.requestKey !== resource.definition.requestKey
        );
      }

      get resources() {
        const { props } = this.renderedElement;
        return Object.keys(props).reduce((resources, key) =>
          props[key]._isTptConnect
            ? resources.concat(props[key])
            : resources
        , []);
      }

      get serverResources() {
        return this.resources.filter((resource) => !resource.clientOnly);
      }

      computeResources() {
        const { onSuccess, onError, onRequest } = this.context.options || {};

        const {
          tptConnect: resources,
          dispatchRequest,
          invalidateResource,
          prepopulateResource
        } = this.renderedElement.props;

        const _dispatchRequest = (definition) => {
          const promise = new Promise((resolve, reject) => {
            // calling the original dispatchRequest
            dispatchRequest(definition, {
              onSuccess: extendFunction(onSuccess, resolve),
              onError: extendFunction(onError, reject)
            });
          });
          onRequest && onRequest(promise);
          return promise;
        };

        return Object.keys(resources).reduce((newResources, key) => {
          const resource = newResources[key];
          const definition = resource.definition;
          resource._isTptConnect = true;
          resource.fetch = () => {
            // storing so we can check which ones changed later
            return _dispatchRequest(definition);
          };
          resource.invalidate = () => invalidateResource(definition);
          resource.prepopulate = () => prepopulateResource(definition);

          // overwrite all actions to use props.dispatchRequest
          Object.keys(definition.actions).forEach((actionKey) => {
            const originalAction = definition.actions[actionKey];
            resource[actionKey] = (...args) => {
              const actionDefinition = typeof originalAction === 'function'
                ? { ...definition, ...originalAction(...args) }
                : { ...definition, ...originalAction };
              const url = fullUrl(actionDefinition.url, actionDefinition.params);
              return _dispatchRequest({ ...actionDefinition, url });
            };
          });

          return newResources;
        }, { ...resources });
      }

      render() {
        const { isServer } = this.context.options || {};
        const { type, props } = super.render();
        const newProps = { ...props, ...this.computeResources(props) };

        delete newProps.tptConnect;
        delete newProps.invalidateResource;
        delete newProps.dispatchRequest;
        delete newProps.prepopulateResource;

        this.renderedElement = createElement(type, newProps);

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
