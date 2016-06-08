import { PropTypes, cloneElement } from 'react';
import { isEqual } from 'lodash';
import { connect as reduxConnect } from 'react-redux';
import { invalidateResource, prepopulateResource, dispatchRequest } from '../actions';
import { findInState, normalizeResourceDefinition } from '../helpers';

function normalizeMap(originalMap, state) {
  if (!originalMap.resources) return originalMap;

  return Object.keys(originalMap.resources).reduce((newMap, key) => {
    const resource = normalizeResourceDefinition(originalMap.resources[key]);
    originalMap.resources[key] = resource;
    newMap[key] = findInState(state, resource) || resource.defaultValue;
    return newMap;
  }, originalMap);
}

function extendFunction(...functions) {
  return (...args) => {
    for (const func of functions) {
      typeof func === 'function' && func.apply(this, args);
    }
  };
}

export default function connect(mapStateToProps, mapDispatchToProps = {}, mergeProps) {
  const _mapStateToProps = (state, ownProps) => {
    const originalMap = mapStateToProps(state, ownProps);
    return normalizeMap(originalMap, state);
  };

  // expose our all our dispatcher except for "dispatchRequest" which was
  // modified on the instance level and is reinjected in the render method below
  const _mapDispatchToProps = {
    ...mapDispatchToProps,
    dispatchRequest,
    prepopulateResource,
    invalidateResource
  };

  return (WrappedComponent) => {
    const ReduxConnect =
      reduxConnect(_mapStateToProps, _mapDispatchToProps, mergeProps)(WrappedComponent);

    return class TptConnect extends ReduxConnect {
      static contextTypes = {
        ...ReduxConnect.contextTypes,
        options: PropTypes.object
      };

      // used to keep track of all components' outstanding fetches when
      // rendering on server. TODO: find a better solution
      static _fetchPromises = [];

      constructor(...args) {
        super(...args);
        this._isFirstRender = true;
      }

      loadResources(resources = {}) {
        const { props } = this.renderedElement;
        Object.keys(resources).forEach((key) => {
          const resource = resources[key];
          if (resource.auto && !findInState(this.store.getState(), resource)) {
            props.prepopulateResource(resource);
            props.dispatchRequest(resource);
          }
        });
      }

      componentWillReceiveProps(...args) {
        super.componentWillReceiveProps(...args);
        this._oldResources = { ...this.allResources };
      }

      componentDidUpdate() {
        this._oldResources || (this._oldResources = this.allResources);
        this.loadResources(
          Object.keys(this.allResources).reduce((changedResources, key) => {
            return isEqual(this._oldResources[key], this.allResources[key])
              ? changedResources
              : { ...changedResources, [key]: this.allResources[key] };
          }, {})
        );
      }

      get allResources() {
        return this.renderedElement.props.resources || {};
      }

      render() {
        const { onSuccess, onError } = this.context.options || {};
        const renderedElement = super.render();
        const { props } = renderedElement;

        // creating custom dispatchRequest so we can force usage of global opts
        // and promisify the return value
        const _dispatchRequest = (definition) => {
          const promise = new Promise((resolve, reject) => {
            props.dispatchRequest(definition, {
              onSuccess: extendFunction(onSuccess, resolve),
              onError: extendFunction(onError, reject)
            });
          });

          TptConnect._fetchPromises.push(promise);

          return promise;
        };

        this.renderedElement = cloneElement(renderedElement, {
          ...props,
          dispatchRequest: _dispatchRequest
        });

        // componentDidMount isnt getting called on server render
        if (this._isFirstRender) {
          this.loadResources(this.allResources);
          this._oldResources = { ...this.allResources };
          this._isFirstRender = false;
        }

        return this.renderedElement;
      }
    };
  };
}
