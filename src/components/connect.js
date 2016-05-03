import { isEqual } from 'lodash';
import { connect as reduxConnect } from 'react-redux';
import { invalidateResource, prepopulateResource, fetchResource } from '../actions';
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

export default function connect(mapStateToProps, mapDispatchToProps = {}, mergeProps) {
  const _mapStateToProps = (state, ownProps) => {
    const originalMap = mapStateToProps(state, ownProps);
    return normalizeMap(originalMap, state);
  };

  // expose our 'fetchResource' dispatch func so can be called by client manually
  const _mapDispatchToProps = Object.assign({}, mapDispatchToProps, {
    fetchResource,
    prepopulateResource,
    invalidateResource
  });

  return (WrappedComponent) => {
    const ReduxConnect =
      reduxConnect(_mapStateToProps, _mapDispatchToProps, mergeProps)(WrappedComponent);

    return class TptConnect extends ReduxConnect {
      loadResources(resources = {}) {
        const { props } = this.renderedElement;
        Object.keys(resources).forEach((key) => {
          const resource = resources[key];
          if (resource.auto && !findInState(this.store.getState(), resource)) {
            props.prepopulateResource(resource);
            props.fetchResource(resource);
          }
        });
      }

      componentDidMount() {
        super.componentDidMount();
        this.loadResources(this.allResources);
        this._oldResources = Object.assign({}, this.allResources);
      }

      componentWillReceiveProps(...args) {
        super.componentWillReceiveProps(...args);
        this._oldResources = Object.assign({}, this.allResources);
      }

      componentDidUpdate() {
        this._oldResources || (this._oldResources = this.allResources);
        this.loadResources(
          Object.keys(this.allResources).reduce((changedResources, key) => {
            return isEqual(this._oldResources[key], this.allResources[key])
              ? changedResources
              : Object.assign({}, changedResources, { [key]: this.allResources[key] });
          }, {})
        );
      }

      get allResources() {
        return this.renderedElement.props.resources || {};
      }
    };
  };
}
