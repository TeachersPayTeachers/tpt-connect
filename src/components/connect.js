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

      componentDidMount() {
        super.componentDidMount();
        this.loadResources(this.allResources);
        this._oldResources = { ...this.allResources };
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
        this.renderedElement = cloneElement(renderedElement, {
          ...props,
          // creating custom one so we can force usage of global opts
          dispatchRequest: (definition, opts = {}) => {
            opts.onSuccess = extendFunction(onSuccess, opts.onSuccess);
            opts.onError = extendFunction(onError, opts.onError);
            return props.dispatchRequest(definition, opts);
          }
        });
        return this.renderedElement;
      }
    };
  };
}
