const path = require('path');
const webpack = require('webpack');
const ComponentResolverPlugin = require('component-resolver-webpack');

const common = require('./webpack.common.config');

const config = common.readConfig();
const meta = common.readMetadata();

module.exports = {
  cache: true,
  watch: true,
  devtool: 'source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    path.join(__dirname, 'src', 'bootstrap')
  ],
  output: {
    rootPath: '/',
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel', include: /src/, exclude: /node_modules/ }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: [
    new webpack.DefinePlugin({
      CONFIG: JSON.stringify(config),
      META: JSON.stringify(meta)
    }),
    new webpack.ResolverPlugin([
      new ComponentResolverPlugin()
    ])
  ],
  devServer: {
    historyApiFallback: true
  }
};
