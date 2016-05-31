const path = require('path');

module.exports = {
  cache: true,
  devtool: 'inline-source-map',
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel', exclude: /(node_modules|bower_components)/ },
      { test: /\.jsx?$/, loader: 'isparta', include: path.join(__dirname, 'src') }
    ]
  }
};
