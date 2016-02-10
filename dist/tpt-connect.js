module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.connect = exports.Provider = undefined;
	
	var _Provider2 = __webpack_require__(2);
	
	var _Provider3 = _interopRequireDefault(_Provider2);
	
	var _connect2 = __webpack_require__(4);
	
	var _connect3 = _interopRequireDefault(_connect2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.Provider = _Provider3.default;
	exports.connect = _connect3.default;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(3);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	/**
	 * Used to create a context so our children can access our cache store
	 */
	
	var Provider = function (_Component) {
	  _inherits(Provider, _Component);
	
	  function Provider() {
	    _classCallCheck(this, Provider);
	
	    return _possibleConstructorReturn(this, Object.getPrototypeOf(Provider).apply(this, arguments));
	  }
	
	  _createClass(Provider, [{
	    key: 'getChildContext',
	    value: function getChildContext() {
	      return {
	        cache: this.props.cache
	      };
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return this.props.children;
	    }
	  }]);
	
	  return Provider;
	}(_react.Component);
	
	Provider.childContextTypes = {
	  cache: _react.PropTypes.shape({
	    get: _react.PropTypes.func.isRequired,
	    set: _react.PropTypes.func.isRequired
	  })
	};
	exports.default = Provider;
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("react");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
	
	exports.default = connect;
	
	var _react = __webpack_require__(3);
	
	var _reactRefetch = __webpack_require__(5);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * TptConnect adds the following attributes to each mapping:
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * - ttl - for how long should the mapping be cached. If not provided, no caching will be used.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * - type - will validate we get the correct type or else reject the promise.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *   also used to set default value if missing
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * - default - default value to populate the `value` property of the promise with
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */
	
	/**
	 * Overrides react-refetch `connect` function so we can return TptConnect
	 * component instead of RefetchConnect.
	 */
	function connect() {
	  var mapPropsToRequestsToProps = arguments.length <= 0 || arguments[0] === undefined ? function () {
	    return {};
	  } : arguments[0];
	
	  return function (WrappedComponent) {
	    // The original react-refetch component
	    var RefetchConnect = (0, _reactRefetch.connect)(mapPropsToRequestsToProps)(WrappedComponent);
	
	    var TptConnect = function (_RefetchConnect) {
	      _inherits(TptConnect, _RefetchConnect);
	
	      /**
	       * @override
	       */
	
	      function TptConnect(props, context) {
	        _classCallCheck(this, TptConnect);
	
	        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TptConnect).call(this, props, context));
	
	        _this.cache = context.cache;
	        return _this;
	      }
	
	      /**
	       * Allows using cache before defaulting to network to fetch value
	       * @override
	       */
	
	
	      _createClass(TptConnect, [{
	        key: 'refetchDataFromMappings',
	        value: function refetchDataFromMappings(mappings) {
	          var _this2 = this;
	
	          var mapping = undefined;
	          Object.keys(mappings).forEach(function (prop) {
	            mapping = mappings[prop];
	            if (!mapping.force && mapping.ttl) {
	              // try to get cached data
	              // populating mapping.value will set it immediately w/out making the request
	              mapping.value = _this2.getCachedData(prop, mapping);
	              if (mapping.value) {
	                mapping.value._isCache = true;
	                // react-refetch won't allow value & url to be set together
	                mapping.url = null;
	              }
	            }
	          });
	          return _get(Object.getPrototypeOf(TptConnect.prototype), 'refetchDataFromMappings', this).call(this, mappings);
	        }
	
	        /**
	         * Allows to add default value to promise
	         * @override
	         */
	
	      }, {
	        key: 'createInitialPromiseState',
	        value: function createInitialPromiseState(prop, mapping) {
	          var _this3 = this;
	
	          var defaultValue = mapping.default || (typeof mapping.type === 'function' ? mapping.type() : null);
	
	          return function () {
	            var ps = _get(Object.getPrototypeOf(TptConnect.prototype), 'createInitialPromiseState', _this3).call(_this3, prop, mapping).apply(undefined, arguments);
	            ps.value = defaultValue;
	            return ps;
	          };
	        }
	
	        /**
	         * Allows storing network response in cache
	         * @override
	         */
	
	      }, {
	        key: 'createPromiseStateOnFulfillment',
	        value: function createPromiseStateOnFulfillment(prop, mapping, startedAt) {
	          var _this4 = this;
	
	          var firstFunc = _get(Object.getPrototypeOf(TptConnect.prototype), 'createPromiseStateOnFulfillment', this).call(this, prop, mapping, startedAt);
	          return function (meta) {
	            var secondFunc = firstFunc(meta);
	            return function (value) {
	              if (mapping.type && !(value instanceof mapping.type)) {
	                throw new TypeError('TptConnect expected value to be of type\n                ' + mapping.type.name + '. Instead got ' + value.constructor.name);
	              }
	              if (!value._isCache && mapping.ttl && mapping.method.toUpperCase() !== 'GET') {
	                _this4.setCachedData(prop, mapping, value);
	              }
	              secondFunc(value);
	            };
	          };
	        }
	
	        /**
	         * Generates cache key based on the `comparison` string provided or the
	         * request's URL.
	         */
	
	      }, {
	        key: 'cacheKeyFor',
	        value: function cacheKeyFor(prop, mapping) {
	          // TODO: ultimately, we should use ['value', 'url', 'method', 'headers',
	          // 'body'] to construct our comparison string (at least that's how
	          // react-refetch checks for mappings equality to determine if it needs to
	          // make anther request), but all we have at this point (before calling
	          // `coerceMappings` which is private) is the property name and the URL
	          var key = mapping.comparison || mapping.url;
	          return [this.constructor.name, prop, key].join(this.cache.options.prefixSeparator);
	        }
	      }, {
	        key: 'setCachedData',
	        value: function setCachedData(prop, mapping, value) {
	          this.cache.set(this.cacheKeyFor(prop, mapping), value);
	        }
	      }, {
	        key: 'getCachedData',
	        value: function getCachedData(prop, mapping) {
	          // TODO: this is hacky. it sets the cache expiration every time before
	          // we get the value so we dont end up w stale values
	          this.cache.options.expiration = mapping.ttl;
	          return this.cache.get(this.cacheKeyFor(prop, mapping));
	        }
	      }]);
	
	      return TptConnect;
	    }(RefetchConnect);
	
	    TptConnect.contextTypes = {
	      cache: _react.PropTypes.object.isRequired
	    };
	
	
	    return TptConnect;
	  };
	}
	module.exports = exports['default'];

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.__esModule = true;
	
	var _connect = __webpack_require__(6);
	
	Object.defineProperty(exports, 'connect', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_connect).default;
	  }
	});
	
	var _PromiseState = __webpack_require__(13);
	
	Object.defineProperty(exports, 'PromiseState', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_PromiseState).default;
	  }
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	exports.__esModule = true;
	exports.default = connect;
	
	__webpack_require__(8);
	
	var _react = __webpack_require__(3);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _isPlainObject = __webpack_require__(9);
	
	var _isPlainObject2 = _interopRequireDefault(_isPlainObject);
	
	var _deepValue = __webpack_require__(10);
	
	var _deepValue2 = _interopRequireDefault(_deepValue);
	
	var _shallowEqual = __webpack_require__(11);
	
	var _shallowEqual2 = _interopRequireDefault(_shallowEqual);
	
	var _errors = __webpack_require__(12);
	
	var _errors2 = _interopRequireDefault(_errors);
	
	var _PromiseState = __webpack_require__(13);
	
	var _PromiseState2 = _interopRequireDefault(_PromiseState);
	
	var _hoistNonReactStatics = __webpack_require__(14);
	
	var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);
	
	var _invariant = __webpack_require__(15);
	
	var _invariant2 = _interopRequireDefault(_invariant);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var defaultMapPropsToRequestsToProps = function defaultMapPropsToRequestsToProps() {
	  return {};
	};
	
	function getDisplayName(WrappedComponent) {
	  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
	}
	
	// Helps track hot reloading.
	var nextVersion = 0;
	
	function connect(mapPropsToRequestsToProps) {
	  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	  var finalMapPropsToRequestsToProps = mapPropsToRequestsToProps || defaultMapPropsToRequestsToProps;
	  var _options$withRef = options.withRef;
	  var withRef = _options$withRef === undefined ? false : _options$withRef;
	
	  // Helps track hot reloading.
	
	  var version = nextVersion++;
	
	  function coerceMappings(rawMappings) {
	    (0, _invariant2.default)((0, _isPlainObject2.default)(rawMappings), '`mapPropsToRequestsToProps` must return an object. Instead received %s.', rawMappings);
	
	    var mappings = {};
	    Object.keys(rawMappings).forEach(function (prop) {
	      mappings[prop] = coerceMapping(prop, rawMappings[prop]);
	    });
	    return mappings;
	  }
	
	  function coerceMapping(prop, mapping) {
	    if (Function.prototype.isPrototypeOf(mapping)) {
	      return mapping;
	    }
	
	    if (typeof mapping === 'string') {
	      mapping = { url: mapping };
	    }
	
	    (0, _invariant2.default)((0, _isPlainObject2.default)(mapping), 'Request for `%s` must be either a string or a plain object. Instead received %s', prop, mapping);
	    (0, _invariant2.default)(mapping.url || mapping.value, 'Request object for `%s` must have `url` (or `value`) attribute.', prop);
	    (0, _invariant2.default)(!(mapping.url && mapping.value), 'Request object for `%s` must not have both `url` and `value` attributes.', prop);
	
	    mapping = assignDefaults(mapping);
	
	    (0, _invariant2.default)((0, _isPlainObject2.default)(mapping.meta), 'meta for `%s` must be a plain object. Instead received %s', prop, mapping.meta);
	
	    mapping.equals = function (that) {
	      var _this = this;
	
	      if (this.comparison !== undefined) {
	        return this.comparison === that.comparison;
	      }
	
	      return ['value', 'url', 'method', 'headers', 'body'].every(function (c) {
	        return (0, _shallowEqual2.default)((0, _deepValue2.default)(_this, c), (0, _deepValue2.default)(that, c));
	      });
	    }.bind(mapping);
	
	    return mapping;
	  }
	
	  function assignDefaults(mapping) {
	    return Object.assign({
	      method: 'GET',
	      credentials: 'same-origin',
	      redirect: 'follow',
	      meta: {}
	    }, mapping, {
	      headers: Object.assign({
	        'Accept': 'application/json',
	        'Content-Type': 'application/json'
	      }, mapping.headers)
	    });
	  }
	
	  function buildRequest(mapping) {
	    return new window.Request(mapping.url, {
	      method: mapping.method,
	      headers: mapping.headers,
	      credentials: mapping.credentials,
	      redirect: mapping.redirect,
	      body: mapping.body
	    });
	  }
	
	  function handleResponse(response) {
	    var json = response.json(); // TODO: support other response types
	    if (response.status >= 200 && response.status < 300) {
	      // TODO: support custom acceptable statuses
	      return json;
	    } else {
	      return json.then(function (cause) {
	        return Promise.reject((0, _errors2.default)(cause));
	      });
	    }
	  }
	
	  return function wrapWithConnect(WrappedComponent) {
	    var RefetchConnect = function (_Component) {
	      _inherits(RefetchConnect, _Component);
	
	      function RefetchConnect(props, context) {
	        _classCallCheck(this, RefetchConnect);
	
	        var _this2 = _possibleConstructorReturn(this, _Component.call(this, props, context));
	
	        _this2.version = version;
	        _this2.state = { mappings: {}, startedAts: {}, data: {}, refreshTimeouts: {} };
	        return _this2;
	      }
	
	      RefetchConnect.prototype.componentWillMount = function componentWillMount() {
	        this.refetchDataFromProps();
	      };
	
	      RefetchConnect.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
	        this.refetchDataFromProps(nextProps);
	      };
	
	      RefetchConnect.prototype.componentWillUnmount = function componentWillUnmount() {
	        this.clearAllRefreshTimeouts();
	      };
	
	      RefetchConnect.prototype.render = function render() {
	        var ref = withRef ? 'wrappedInstance' : null;
	        return _react2.default.createElement(WrappedComponent, _extends({}, this.state.data, this.props, { ref: ref }));
	      };
	
	      RefetchConnect.prototype.getWrappedInstance = function getWrappedInstance() {
	        (0, _invariant2.default)(withRef, 'To access the wrapped instance, you need to specify ' + '{ withRef: true } as the fourth argument of the connect() call.');
	
	        return this.refs.wrappedInstance;
	      };
	
	      RefetchConnect.prototype.refetchDataFromProps = function refetchDataFromProps() {
	        var props = arguments.length <= 0 || arguments[0] === undefined ? this.props : arguments[0];
	
	        this.refetchDataFromMappings(finalMapPropsToRequestsToProps(props) || {});
	      };
	
	      RefetchConnect.prototype.refetchDataFromMappings = function refetchDataFromMappings(mappings) {
	        var _this3 = this;
	
	        mappings = coerceMappings(mappings);
	        Object.keys(mappings).forEach(function (prop) {
	          var mapping = mappings[prop];
	
	          if (Function.prototype.isPrototypeOf(mapping)) {
	            _this3.setAtomicState(prop, new Date(), mapping, function () {
	              for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	                args[_key] = arguments[_key];
	              }
	
	              _this3.refetchDataFromMappings(mapping.apply(undefined, args || {}));
	            });
	            return;
	          }
	
	          if (mapping.force || !mapping.equals(_this3.state.mappings[prop] || {})) {
	            _this3.refetchDatum(prop, mapping);
	          }
	        });
	      };
	
	      RefetchConnect.prototype.refetchDatum = function refetchDatum(prop, mapping) {
	        var startedAt = new Date();
	
	        if (this.state.refreshTimeouts[prop]) {
	          window.clearTimeout(this.state.refreshTimeouts[prop]);
	        }
	
	        return this.createPromise(prop, mapping, startedAt);
	      };
	
	      RefetchConnect.prototype.createPromise = function createPromise(prop, mapping, startedAt) {
	        var _this4 = this;
	
	        var meta = mapping.meta;
	        var initPS = this.createInitialPromiseState(prop, mapping);
	        var onFulfillment = this.createPromiseStateOnFulfillment(prop, mapping, startedAt);
	        var onRejection = this.createPromiseStateOnRejection(prop, mapping, startedAt);
	
	        if (mapping.value) {
	          this.setAtomicState(prop, startedAt, mapping, initPS(meta));
	          return Promise.resolve(mapping.value).then(onFulfillment(meta), onRejection(meta));
	        } else {
	          var _ret = function () {
	            var request = buildRequest(mapping);
	            meta.request = request;
	            _this4.setAtomicState(prop, startedAt, mapping, initPS(meta));
	
	            var fetched = window.fetch(request);
	            return {
	              v: fetched.then(function (response) {
	                meta.response = response;
	                return fetched.then(handleResponse).then(onFulfillment(meta), onRejection(meta));
	              })
	            };
	          }();
	
	          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	        }
	      };
	
	      RefetchConnect.prototype.createInitialPromiseState = function createInitialPromiseState(prop, mapping) {
	        var _this5 = this;
	
	        return function (meta) {
	          return mapping.refreshing ? _PromiseState2.default.refresh(_this5.state.data[prop], meta) : _PromiseState2.default.create(meta);
	        };
	      };
	
	      RefetchConnect.prototype.createPromiseStateOnFulfillment = function createPromiseStateOnFulfillment(prop, mapping, startedAt) {
	        var _this6 = this;
	
	        return function (meta) {
	          return function (value) {
	            var refreshTimeout = null;
	            if (mapping.refreshInterval > 0) {
	              refreshTimeout = window.setTimeout(function () {
	                _this6.refetchDatum(prop, Object.assign({}, mapping, { refreshing: true, force: true }));
	              }, mapping.refreshInterval);
	            }
	
	            if (Function.prototype.isPrototypeOf(mapping.then)) {
	              _this6.refetchDatum(prop, coerceMapping(null, mapping.then(value, meta)));
	              return;
	            }
	
	            _this6.setAtomicState(prop, startedAt, mapping, _PromiseState2.default.resolve(value, meta), refreshTimeout, function () {
	              if (Function.prototype.isPrototypeOf(mapping.andThen)) {
	                _this6.refetchDataFromMappings(mapping.andThen(value, meta));
	              }
	            });
	          };
	        };
	      };
	
	      RefetchConnect.prototype.createPromiseStateOnRejection = function createPromiseStateOnRejection(prop, mapping, startedAt) {
	        var _this7 = this;
	
	        return function (meta) {
	          return function (reason) {
	            if (Function.prototype.isPrototypeOf(mapping.catch)) {
	              _this7.refetchDatum(prop, coerceMapping(null, mapping.catch(reason, meta)));
	              return;
	            }
	
	            _this7.setAtomicState(prop, startedAt, mapping, _PromiseState2.default.reject(reason, meta), null, function () {
	              if (Function.prototype.isPrototypeOf(mapping.andCatch)) {
	                _this7.refetchDataFromMappings(mapping.andCatch(reason, meta));
	              }
	            });
	          };
	        };
	      };
	
	      RefetchConnect.prototype.setAtomicState = function setAtomicState(prop, startedAt, mapping, datum, refreshTimeout, callback) {
	        this.setState(function (prevState) {
	          var _Object$assign, _Object$assign2, _Object$assign3, _Object$assign4;
	
	          if (startedAt < prevState.startedAts[prop]) {
	            return {};
	          }
	
	          return {
	            startedAts: Object.assign(prevState.startedAts, (_Object$assign = {}, _Object$assign[prop] = startedAt, _Object$assign)),
	            mappings: Object.assign(prevState.mappings, (_Object$assign2 = {}, _Object$assign2[prop] = mapping, _Object$assign2)),
	            data: Object.assign(prevState.data, (_Object$assign3 = {}, _Object$assign3[prop] = datum, _Object$assign3)),
	            refreshTimeouts: Object.assign(prevState.refreshTimeouts, (_Object$assign4 = {}, _Object$assign4[prop] = refreshTimeout, _Object$assign4))
	          };
	        }, callback);
	      };
	
	      RefetchConnect.prototype.clearAllRefreshTimeouts = function clearAllRefreshTimeouts() {
	        var _this8 = this;
	
	        Object.keys(this.state.refreshTimeouts).forEach(function (prop) {
	          clearTimeout(_this8.state.refreshTimeouts[prop]);
	        });
	      };
	
	      return RefetchConnect;
	    }(_react.Component);
	
	    RefetchConnect.displayName = 'Refetch.connect(' + getDisplayName(WrappedComponent) + ')';
	    RefetchConnect.WrappedComponent = WrappedComponent;
	
	    if (process.env.NODE_ENV !== 'production') {
	      RefetchConnect.prototype.componentWillUpdate = function componentWillUpdate() {
	        if (this.version === version) {
	          return;
	        }
	
	        // We are hot reloading!
	        this.version = version;
	        this.clearAllRefreshTimeouts();
	        this.refetchDataFromProps();
	      };
	    }
	
	    return (0, _hoistNonReactStatics2.default)(RefetchConnect, WrappedComponent);
	  };
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ },
/* 7 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 8 */
/***/ function(module, exports) {

	(function(self) {
	  'use strict';
	
	  if (self.fetch) {
	    return
	  }
	
	  function normalizeName(name) {
	    if (typeof name !== 'string') {
	      name = String(name)
	    }
	    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
	      throw new TypeError('Invalid character in header field name')
	    }
	    return name.toLowerCase()
	  }
	
	  function normalizeValue(value) {
	    if (typeof value !== 'string') {
	      value = String(value)
	    }
	    return value
	  }
	
	  function Headers(headers) {
	    this.map = {}
	
	    if (headers instanceof Headers) {
	      headers.forEach(function(value, name) {
	        this.append(name, value)
	      }, this)
	
	    } else if (headers) {
	      Object.getOwnPropertyNames(headers).forEach(function(name) {
	        this.append(name, headers[name])
	      }, this)
	    }
	  }
	
	  Headers.prototype.append = function(name, value) {
	    name = normalizeName(name)
	    value = normalizeValue(value)
	    var list = this.map[name]
	    if (!list) {
	      list = []
	      this.map[name] = list
	    }
	    list.push(value)
	  }
	
	  Headers.prototype['delete'] = function(name) {
	    delete this.map[normalizeName(name)]
	  }
	
	  Headers.prototype.get = function(name) {
	    var values = this.map[normalizeName(name)]
	    return values ? values[0] : null
	  }
	
	  Headers.prototype.getAll = function(name) {
	    return this.map[normalizeName(name)] || []
	  }
	
	  Headers.prototype.has = function(name) {
	    return this.map.hasOwnProperty(normalizeName(name))
	  }
	
	  Headers.prototype.set = function(name, value) {
	    this.map[normalizeName(name)] = [normalizeValue(value)]
	  }
	
	  Headers.prototype.forEach = function(callback, thisArg) {
	    Object.getOwnPropertyNames(this.map).forEach(function(name) {
	      this.map[name].forEach(function(value) {
	        callback.call(thisArg, value, name, this)
	      }, this)
	    }, this)
	  }
	
	  function consumed(body) {
	    if (body.bodyUsed) {
	      return Promise.reject(new TypeError('Already read'))
	    }
	    body.bodyUsed = true
	  }
	
	  function fileReaderReady(reader) {
	    return new Promise(function(resolve, reject) {
	      reader.onload = function() {
	        resolve(reader.result)
	      }
	      reader.onerror = function() {
	        reject(reader.error)
	      }
	    })
	  }
	
	  function readBlobAsArrayBuffer(blob) {
	    var reader = new FileReader()
	    reader.readAsArrayBuffer(blob)
	    return fileReaderReady(reader)
	  }
	
	  function readBlobAsText(blob) {
	    var reader = new FileReader()
	    reader.readAsText(blob)
	    return fileReaderReady(reader)
	  }
	
	  var support = {
	    blob: 'FileReader' in self && 'Blob' in self && (function() {
	      try {
	        new Blob();
	        return true
	      } catch(e) {
	        return false
	      }
	    })(),
	    formData: 'FormData' in self,
	    arrayBuffer: 'ArrayBuffer' in self
	  }
	
	  function Body() {
	    this.bodyUsed = false
	
	
	    this._initBody = function(body) {
	      this._bodyInit = body
	      if (typeof body === 'string') {
	        this._bodyText = body
	      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
	        this._bodyBlob = body
	      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
	        this._bodyFormData = body
	      } else if (!body) {
	        this._bodyText = ''
	      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
	        // Only support ArrayBuffers for POST method.
	        // Receiving ArrayBuffers happens via Blobs, instead.
	      } else {
	        throw new Error('unsupported BodyInit type')
	      }
	
	      if (!this.headers.get('content-type')) {
	        if (typeof body === 'string') {
	          this.headers.set('content-type', 'text/plain;charset=UTF-8')
	        } else if (this._bodyBlob && this._bodyBlob.type) {
	          this.headers.set('content-type', this._bodyBlob.type)
	        }
	      }
	    }
	
	    if (support.blob) {
	      this.blob = function() {
	        var rejected = consumed(this)
	        if (rejected) {
	          return rejected
	        }
	
	        if (this._bodyBlob) {
	          return Promise.resolve(this._bodyBlob)
	        } else if (this._bodyFormData) {
	          throw new Error('could not read FormData body as blob')
	        } else {
	          return Promise.resolve(new Blob([this._bodyText]))
	        }
	      }
	
	      this.arrayBuffer = function() {
	        return this.blob().then(readBlobAsArrayBuffer)
	      }
	
	      this.text = function() {
	        var rejected = consumed(this)
	        if (rejected) {
	          return rejected
	        }
	
	        if (this._bodyBlob) {
	          return readBlobAsText(this._bodyBlob)
	        } else if (this._bodyFormData) {
	          throw new Error('could not read FormData body as text')
	        } else {
	          return Promise.resolve(this._bodyText)
	        }
	      }
	    } else {
	      this.text = function() {
	        var rejected = consumed(this)
	        return rejected ? rejected : Promise.resolve(this._bodyText)
	      }
	    }
	
	    if (support.formData) {
	      this.formData = function() {
	        return this.text().then(decode)
	      }
	    }
	
	    this.json = function() {
	      return this.text().then(JSON.parse)
	    }
	
	    return this
	  }
	
	  // HTTP methods whose capitalization should be normalized
	  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']
	
	  function normalizeMethod(method) {
	    var upcased = method.toUpperCase()
	    return (methods.indexOf(upcased) > -1) ? upcased : method
	  }
	
	  function Request(input, options) {
	    options = options || {}
	    var body = options.body
	    if (Request.prototype.isPrototypeOf(input)) {
	      if (input.bodyUsed) {
	        throw new TypeError('Already read')
	      }
	      this.url = input.url
	      this.credentials = input.credentials
	      if (!options.headers) {
	        this.headers = new Headers(input.headers)
	      }
	      this.method = input.method
	      this.mode = input.mode
	      if (!body) {
	        body = input._bodyInit
	        input.bodyUsed = true
	      }
	    } else {
	      this.url = input
	    }
	
	    this.credentials = options.credentials || this.credentials || 'omit'
	    if (options.headers || !this.headers) {
	      this.headers = new Headers(options.headers)
	    }
	    this.method = normalizeMethod(options.method || this.method || 'GET')
	    this.mode = options.mode || this.mode || null
	    this.referrer = null
	
	    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
	      throw new TypeError('Body not allowed for GET or HEAD requests')
	    }
	    this._initBody(body)
	  }
	
	  Request.prototype.clone = function() {
	    return new Request(this)
	  }
	
	  function decode(body) {
	    var form = new FormData()
	    body.trim().split('&').forEach(function(bytes) {
	      if (bytes) {
	        var split = bytes.split('=')
	        var name = split.shift().replace(/\+/g, ' ')
	        var value = split.join('=').replace(/\+/g, ' ')
	        form.append(decodeURIComponent(name), decodeURIComponent(value))
	      }
	    })
	    return form
	  }
	
	  function headers(xhr) {
	    var head = new Headers()
	    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
	    pairs.forEach(function(header) {
	      var split = header.trim().split(':')
	      var key = split.shift().trim()
	      var value = split.join(':').trim()
	      head.append(key, value)
	    })
	    return head
	  }
	
	  Body.call(Request.prototype)
	
	  function Response(bodyInit, options) {
	    if (!options) {
	      options = {}
	    }
	
	    this.type = 'default'
	    this.status = options.status
	    this.ok = this.status >= 200 && this.status < 300
	    this.statusText = options.statusText
	    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
	    this.url = options.url || ''
	    this._initBody(bodyInit)
	  }
	
	  Body.call(Response.prototype)
	
	  Response.prototype.clone = function() {
	    return new Response(this._bodyInit, {
	      status: this.status,
	      statusText: this.statusText,
	      headers: new Headers(this.headers),
	      url: this.url
	    })
	  }
	
	  Response.error = function() {
	    var response = new Response(null, {status: 0, statusText: ''})
	    response.type = 'error'
	    return response
	  }
	
	  var redirectStatuses = [301, 302, 303, 307, 308]
	
	  Response.redirect = function(url, status) {
	    if (redirectStatuses.indexOf(status) === -1) {
	      throw new RangeError('Invalid status code')
	    }
	
	    return new Response(null, {status: status, headers: {location: url}})
	  }
	
	  self.Headers = Headers;
	  self.Request = Request;
	  self.Response = Response;
	
	  self.fetch = function(input, init) {
	    return new Promise(function(resolve, reject) {
	      var request
	      if (Request.prototype.isPrototypeOf(input) && !init) {
	        request = input
	      } else {
	        request = new Request(input, init)
	      }
	
	      var xhr = new XMLHttpRequest()
	
	      function responseURL() {
	        if ('responseURL' in xhr) {
	          return xhr.responseURL
	        }
	
	        // Avoid security warnings on getResponseHeader when not allowed by CORS
	        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
	          return xhr.getResponseHeader('X-Request-URL')
	        }
	
	        return;
	      }
	
	      xhr.onload = function() {
	        var status = (xhr.status === 1223) ? 204 : xhr.status
	        if (status < 100 || status > 599) {
	          reject(new TypeError('Network request failed'))
	          return
	        }
	        var options = {
	          status: status,
	          statusText: xhr.statusText,
	          headers: headers(xhr),
	          url: responseURL()
	        }
	        var body = 'response' in xhr ? xhr.response : xhr.responseText;
	        resolve(new Response(body, options))
	      }
	
	      xhr.onerror = function() {
	        reject(new TypeError('Network request failed'))
	      }
	
	      xhr.open(request.method, request.url, true)
	
	      if (request.credentials === 'include') {
	        xhr.withCredentials = true
	      }
	
	      if ('responseType' in xhr && support.blob) {
	        xhr.responseType = 'blob'
	      }
	
	      request.headers.forEach(function(value, name) {
	        xhr.setRequestHeader(name, value)
	      })
	
	      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
	    })
	  }
	  self.fetch.polyfill = true
	})(typeof self !== 'undefined' ? self : this);


/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	exports.__esModule = true;
	exports.default = isPlainObject;
	var fnToString = function fnToString(fn) {
	  return Function.prototype.toString.call(fn);
	};
	
	/**
	 * @param {any} obj The object to inspect.
	 * @returns {boolean} True if the argument appears to be a plain object.
	 */
	function isPlainObject(obj) {
	  if (!obj || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
	    return false;
	  }
	
	  var proto = typeof obj.constructor === 'function' ? Object.getPrototypeOf(obj) : Object.prototype;
	
	  if (proto === null) {
	    return true;
	  }
	
	  var constructor = proto.constructor;
	
	  return typeof constructor === 'function' && constructor instanceof constructor && fnToString(constructor) === fnToString(Object);
	}

/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	exports.default = deepValue;
	function deepValue(obj, path) {
	  for (var i = 0, spath = path.split('.'), len = spath.length; i < len; i++) {
	    if (obj === undefined) {
	      return obj;
	    }
	    obj = obj[spath[i]];
	  }
	  return obj;
	}

/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	exports.default = shallowEqual;
	function shallowEqual(objA, objB) {
	  if (objA === objB) {
	    return true;
	  }
	
	  if (objA === undefined || objB === undefined) {
	    return false;
	  }
	
	  var keysA = Object.keys(objA);
	  var keysB = Object.keys(objB);
	
	  if (keysA.length !== keysB.length) {
	    return false;
	  }
	
	  // Test for A's keys different from B.
	  var hasOwn = Object.prototype.hasOwnProperty;
	  for (var i = 0; i < keysA.length; i++) {
	    if (!hasOwn.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
	      return false;
	    }
	  }
	
	  return true;
	}

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	
	exports.__esModule = true;
	exports.default = newError;
	function newError(cause) {
	  var e = new Error(parse(cause));
	  e.cause = cause;
	  return e;
	}
	
	function parse(cause) {
	  var error = cause.error;
	  var message = cause.message;
	
	  if (error) {
	    return error;
	  } else if (message) {
	    return message;
	  } else {
	    return '';
	  }
	}

/***/ },
/* 13 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var PromiseState = function () {
	
	  // creates a new PromiseState that is pending
	
	  PromiseState.create = function create(meta) {
	    return new PromiseState({
	      pending: true,
	      meta: meta
	    });
	  };
	
	  // creates as PromiseState that is refreshing
	  // can be called without a previous PromiseState and will be both pending and refreshing
	
	  PromiseState.refresh = function refresh(previous, meta) {
	    var ps = previous || PromiseState.create(meta);
	    ps.refreshing = true;
	    return ps;
	  };
	
	  // creates a PromiseState that is resolved with the given value
	
	  PromiseState.resolve = function resolve(value, meta) {
	    return new PromiseState({
	      fulfilled: true,
	      value: value,
	      meta: meta
	    });
	  };
	
	  // creates a PromiseState that is rejected with the given reason
	
	  PromiseState.reject = function reject(reason, meta) {
	    return new PromiseState({
	      rejected: true,
	      reason: reason,
	      meta: meta
	    });
	  };
	
	  // The PromiseState.all(iterable) method returns a PromiseState
	  // that resolves when all of the PromiseStates in the iterable
	  // argument have resolved, or rejects with the reason of the
	  // first passed PromiseState that rejects.
	
	  PromiseState.all = function all(iterable) {
	    return new PromiseState({
	      pending: iterable.some(function (ps) {
	        return ps.pending;
	      }),
	      refreshing: iterable.some(function (ps) {
	        return ps.refreshing;
	      }),
	      fulfilled: iterable.every(function (ps) {
	        return ps.fulfilled;
	      }),
	      rejected: iterable.some(function (ps) {
	        return ps.rejected;
	      }),
	      value: iterable.map(function (ps) {
	        return ps.value;
	      }),
	      reason: (iterable.find(function (ps) {
	        return ps.reason;
	      }) || {}).reason,
	      meta: iterable.map(function (ps) {
	        return ps.meta;
	      })
	    });
	  };
	
	  // The PromiseState.race(iterable) method returns a PromiseState
	  // that resolves or rejects as soon as one of the PromiseStates in
	  // the iterable resolves or rejects, with the value or reason
	  // from that PromiseState.
	
	  PromiseState.race = function race(iterable) {
	    var winner = iterable.find(function (ps) {
	      return ps.settled;
	    });
	
	    return new PromiseState({
	      pending: !winner && iterable.some(function (ps) {
	        return ps.pending;
	      }),
	      refreshing: !winner && iterable.some(function (ps) {
	        return ps.refreshing;
	      }),
	      fulfilled: winner && winner.fulfilled,
	      rejected: winner && winner.rejected,
	      value: winner && winner.value,
	      reason: winner && winner.reason,
	      meta: winner && winner.meta
	    });
	  };
	
	  // Constructor for creating a raw PromiseState. DO NOT USE DIRECTLY. Instead, use PromiseState.create() or other static constructors
	
	  function PromiseState(_ref) {
	    var _ref$pending = _ref.pending;
	    var pending = _ref$pending === undefined ? false : _ref$pending;
	    var _ref$refreshing = _ref.refreshing;
	    var refreshing = _ref$refreshing === undefined ? false : _ref$refreshing;
	    var _ref$fulfilled = _ref.fulfilled;
	    var fulfilled = _ref$fulfilled === undefined ? false : _ref$fulfilled;
	    var _ref$rejected = _ref.rejected;
	    var rejected = _ref$rejected === undefined ? false : _ref$rejected;
	    var _ref$value = _ref.value;
	    var value = _ref$value === undefined ? null : _ref$value;
	    var _ref$reason = _ref.reason;
	    var reason = _ref$reason === undefined ? null : _ref$reason;
	    var _ref$meta = _ref.meta;
	    var meta = _ref$meta === undefined ? {} : _ref$meta;
	
	    _classCallCheck(this, PromiseState);
	
	    this.pending = pending;
	    this.refreshing = refreshing;
	    this.fulfilled = fulfilled;
	    this.rejected = rejected;
	    this.settled = fulfilled || rejected;
	    this.value = value;
	    this.reason = reason;
	    this.meta = meta;
	  }
	
	  // Appends and calls fulfillment and rejection handlers on the PromiseState,
	  // and returns a new PromiseState resolving to the return value of the called handler,
	  // or to its original settled value if the promise was not handled.
	  // The handler functions take the value/reason and meta as parameters.
	  // (i.e. if the relevant handler onFulfilled or onRejected is undefined).
	  // Note, unlike Promise.then(), these handlers are called immediately.
	
	  PromiseState.prototype.then = function then(onFulFilled, onRejected) {
	    if (this.fulfilled && onFulFilled) {
	      return this._mapFlatMapValue(onFulFilled(this.value, this.meta));
	    }
	
	    if (this.rejected && onRejected) {
	      return this._mapFlatMapValue(onRejected(this.reason, this.meta));
	    }
	
	    return this;
	  };
	
	  // Appends and calls a rejection handler callback to the PromiseState,
	  // and returns a new PromiseState resolving to the return value of the
	  // callback if it is called, or to its original fulfillment value if
	  // the PromiseState is instead fulfilled. The handler function take
	  // the reason and meta as parameters. Note, unlike Promise.catch(),
	  // this handlers is called immediately.
	
	  PromiseState.prototype.catch = function _catch(onRejected) {
	    return this.then(undefined, onRejected);
	  };
	
	  PromiseState.prototype._mapFlatMapValue = function _mapFlatMapValue(value) {
	    if (value instanceof PromiseState) {
	      return value;
	    } else {
	      return PromiseState.resolve(value, this.meta);
	    }
	  };
	
	  return PromiseState;
	}();
	
	exports.default = PromiseState;

/***/ },
/* 14 */
/***/ function(module, exports) {

	/**
	 * Copyright 2015, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 */
	'use strict';
	
	var REACT_STATICS = {
	    childContextTypes: true,
	    contextTypes: true,
	    defaultProps: true,
	    displayName: true,
	    getDefaultProps: true,
	    mixins: true,
	    propTypes: true,
	    type: true
	};
	
	var KNOWN_STATICS = {
	    name: true,
	    length: true,
	    prototype: true,
	    caller: true,
	    arguments: true,
	    arity: true
	};
	
	module.exports = function hoistNonReactStatics(targetComponent, sourceComponent) {
	    var keys = Object.getOwnPropertyNames(sourceComponent);
	    for (var i=0; i<keys.length; ++i) {
	        if (!REACT_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]]) {
	            try {
	                targetComponent[keys[i]] = sourceComponent[keys[i]];
	            } catch (error) {
	
	            }
	        }
	    }
	
	    return targetComponent;
	};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 */
	
	'use strict';
	
	/**
	 * Use invariant() to assert state which your program assumes to be true.
	 *
	 * Provide sprintf-style format (only %s is supported) and arguments
	 * to provide information about what broke and what you were
	 * expecting.
	 *
	 * The invariant message will be stripped in production, but the invariant
	 * will remain to ensure logic does not differ in production.
	 */
	
	var invariant = function(condition, format, a, b, c, d, e, f) {
	  if (process.env.NODE_ENV !== 'production') {
	    if (format === undefined) {
	      throw new Error('invariant requires an error message argument');
	    }
	  }
	
	  if (!condition) {
	    var error;
	    if (format === undefined) {
	      error = new Error(
	        'Minified exception occurred; use the non-minified dev environment ' +
	        'for the full error message and additional helpful warnings.'
	      );
	    } else {
	      var args = [a, b, c, d, e, f];
	      var argIndex = 0;
	      error = new Error(
	        format.replace(/%s/g, function() { return args[argIndex++]; })
	      );
	      error.name = 'Invariant Violation';
	    }
	
	    error.framesToPop = 1; // we don't care about invariant's own frame
	    throw error;
	  }
	};
	
	module.exports = invariant;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ }
/******/ ]);
//# sourceMappingURL=tpt-connect.js.map