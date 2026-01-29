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
      'content-script': './src/content-script.ts',
      interceptor: './src/interceptor.ts',
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
    performance: {
      // Chrome extensions have different performance characteristics than web apps
      // The popup is opened on-demand, not as part of initial page load
      maxAssetSize: 500000, // 500 KiB - reasonable for extension UI
      maxEntrypointSize: 500000, // 500 KiB
      hints: isProduction ? 'warning' : false,
    },
    optimization: {
      minimize: isProduction,
      usedExports: true,
      splitChunks: {
        chunks(chunk) {
          // Don't split the background service worker, content scripts, and interceptor - they must be single files
          return (
            chunk.name !== 'background' &&
            chunk.name !== 'devtools-prompt' &&
            chunk.name !== 'content-script' &&
            chunk.name !== 'interceptor'
          );
        },
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'vendor-react',
            priority: 20,
          },
          vendor: {
            test(module) {
              // Exclude lazy-loaded validation dependencies from vendor chunk
              // These should stay in their async chunks loaded on-demand
              if (module.nameForCondition) {
                const name = module.nameForCondition();
                if (
                  name &&
                  /[\\/]node_modules[\\/](acorn|eslint-scope|estraverse|esrecurse|prettier)[\\/]/.test(name)
                ) {
                  return false;
                }
              }
              // Include all other node_modules
              return /[\\/]node_modules[\\/]/.test(module.nameForCondition?.() || '');
            },
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
          { from: 'public/cors-rules.json', to: 'cors-rules.json' },
          { from: 'public/popup.html', to: 'popup.html' },
          { from: 'public/devtools.html', to: 'devtools.html' },
          { from: 'public/window.html', to: 'window.html' },
          { from: 'public/icons', to: 'icons' },
        ],
      }),
    ],
  };
};
