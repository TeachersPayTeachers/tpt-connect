const path = require('path');

module.exports = {
  entry: [path.join(__dirname, 'src', 'tpt-connect')],
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'tpt-connect.js',
    library: 'tpt-connect',
    libraryTarget: 'commonjs2'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel', exclude: /node_modules/ }
    ]
  },
  externals: {
    react: 'react'
  }
}
