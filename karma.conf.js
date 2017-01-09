const webpackConfig = require('./webpack.test.config');

module.exports = function (config) {
  config.set({
    browsers: [
      'Chrome'
    ],
    files: [
      'isomorphic-fetch',
      'tests.webpack.js'
    ],
    preprocessors: {
      'tests.webpack.js': ['webpack', 'sourcemap']
    },
    frameworks: ['jasmine'],
    reporters: [
      'progress',
      'coverage'
    ],
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'json' },
        { type: 'text-summary' }
      ]
    },
    loggers: [
      { type: 'console' }
    ],
    webpack: webpackConfig,
    webpackServer: {
      noInfo: true
    }
  });
};
