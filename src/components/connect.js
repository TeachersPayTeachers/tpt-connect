import { merge, isEqual } from 'lodash';
import { connect as reduxConnect } from 'react-redux';
import request from '../actions';
import { findInState, fullUrl } from '../helpers';
import { normalize } from 'normalizr';

const resourceDefaults = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  normalize
};

function normalizeMap(originalMap, state) {
  if (!originalMap.resources) return originalMap;

  return Object.keys(originalMap.resources).reduce((newMap, key) => {
    const resource =
      merge({}, resourceDefaults, originalMap.resources[key].resource, originalMap.resources[key]);

    resource.url = fullUrl(resource.url, resource.params);
    resource.isArray = !resource.schema.getKey;
    resource.method = resource.method.toUpperCase();
    resource.defaultValue = resource.isArray ? [] : {};

    if (resource.auto === undefined && resource.method === 'GET') {
      resource.auto = true;
    }

    originalMap.resources[key] = resource;

    return merge(newMap, {
      [key]: findInState(state, resource) || resource.defaultValue
    });
  }, originalMap);
}

export default function connect(mapStateToProps, mapDispatchToProps = {}, mergeProps) {
  const _mapStateToProps = (state, ownProps) => {
    const originalMap = mapStateToProps(state, ownProps);
    return normalizeMap(originalMap, state);
  };

  // expose our 'request' dispatch func so can be called by client manually
  const _mapDispatchToProps = merge({}, mapDispatchToProps, { request });

  return (WrappedComponent) => {
    const ReduxConnect =
      reduxConnect(_mapStateToProps, _mapDispatchToProps, mergeProps)(WrappedComponent);

    return class TptConnect extends ReduxConnect {

      /**
       * Dispatches a CONNECT_REQUEST action for all the resources provided
       */
      loadResources(resources = {}) {
        const { props } = this.renderedElement;
        Object.keys(resources).forEach((key) => {
          const resource = resources[key];
          if (resource.auto && !findInState(this.state.storeState, resource)) {
            props.request(resource);
          }
        });
      }

      componentDidMount() {
        super.componentDidMount();
        this.loadResources(this.allResources);
      }

      componentWillReceiveProps(...args) {
        super.componentWillReceiveProps(...args);
        this._oldResources = merge({}, this.allResources);
      }

      componentDidUpdate() {
        this._oldResources || (this._oldResources = this.allResources);
        this.loadResources(
          Object.keys(this.allResources).reduce((changedResources, key) => {
            return isEqual(this._oldResources[key], this.allResources[key])
              ? changedResources
              : merge({}, changedResources, { [key]: this.allResources[key] });
          }, {})
        );
      }

      get allResources() {
        return this.renderedElement.props.resources || {};
      }
    };
  };
}
