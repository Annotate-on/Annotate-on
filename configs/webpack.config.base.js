import path from 'path';
import webpack from 'webpack';
import { dependencies } from '../package.json';
// In your webpack entry point
import 'core-js/features/global-this';

export default {
  externals: [...Object.keys(dependencies || {})],

  module: {
    rules: [
      {
        test: /\.m?js$/, // Handle ESM (ES Modules) for `three` and `drei`
        resolve: {
          // fullySpecified: false, // Important for ESM handling
        },
      },
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'app'),
          // Add the paths to node_modules that need to be transpiled
          path.resolve(__dirname, 'node_modules/three'),
          path.resolve(__dirname, 'node_modules/@react-three')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }
    ]
  },

  output: {
    path: path.join(__dirname, '..', 'app'),
    libraryTarget: 'commonjs2',
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      'three': path.resolve('./node_modules/three'),
    },
    mainFields: ['main', 'module'],
  }

  ,

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    }),

    new webpack.NamedModulesPlugin()
  ]
};
