const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
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
      { test: /\.css$/, loader: ExtractTextPlugin.extract('css?sourceMap') },
      { test: /\.scss$/, loader: ExtractTextPlugin.extract('css?sourceMap!sass?sourceMap') },
      { test: /\.jsx?$/, loader: 'babel', include: /src/, exclude: /node_modules/ },
      { test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file' },
      { test: /\.(png|jpg)$/, loader: 'url?limit=8192' }
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
    new HtmlWebpackPlugin({
      template: 'index.html',
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
