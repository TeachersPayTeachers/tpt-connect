const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ComponentResolverPlugin = require('component-resolver-webpack');

module.exports = {
  cache: true,
  watch: true,
  devtool: 'source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:8080',
    'webpack/hot/only-dev-server',
    path.join(__dirname, '__tests__', 'demo', 'demo')
  ],
  output: {
    rootPath: '/',
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: ExtractTextPlugin.extract('css?sourceMap') },
      { test: /\.scss$/, loader: ExtractTextPlugin.extract('css?sourceMap!sass?sourceMap') },
      { test: /\.jsx?$/, loader: 'babel', exclude: /node_modules/ },
      { test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file' },
      { test: /\.(png|jpg)$/, loader: 'url?limit=8192' }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: '__tests__/demo/index.html',
      inject: true
    }),
    new ExtractTextPlugin('style.css', { allChunks: true }),
    new webpack.ResolverPlugin([
      new ComponentResolverPlugin()
    ])
  ],
  devServer: {
    historyApiFallback: true
  }
};
