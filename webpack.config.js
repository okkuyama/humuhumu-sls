module.exports = {
  entry: './humuhumu.js',
  target: 'node',
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: __dirname,
      exclude: /node_modules/,
    }]
  },
  externals: {
    'aws-sdk': 'aws-sdk'
  }
};
