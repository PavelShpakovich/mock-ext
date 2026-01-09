const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      background: './src/background.ts',
      popup: './src/popup.tsx',
      devtools: './src/devtools.ts',
      'devtools-prompt': './src/devtools-prompt.ts',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    devtool: isProduction ? false : 'cheap-module-source-map',
    optimization: {
      minimize: isProduction,
      usedExports: true,
      splitChunks: {
        chunks(chunk) {
          // Don't split the background service worker and content scripts - they must be single files
          return chunk.name !== 'background' && chunk.name !== 'devtools-prompt';
        },
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'vendor-react',
            priority: 20,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
          },
        },
      },
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'styles.css',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'public/manifest.json', to: 'manifest.json' },
          { from: 'public/popup.html', to: 'popup.html' },
          { from: 'public/devtools.html', to: 'devtools.html' },
          { from: 'public/icons', to: 'icons' },
        ],
      }),
    ],
  };
};
