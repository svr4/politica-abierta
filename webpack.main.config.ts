import type { Configuration, WebpackPluginInstance } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const relocateLoader = require('@vercel/webpack-asset-relocator-loader');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AssetRelocatorPatch = require('@electron-forge/plugin-webpack/dist/util/AssetRelocatorPatch');

const mainPlugins: WebpackPluginInstance[] = [
  ...plugins,
  {
    apply(compiler) {
      compiler.hooks.compilation.tap('webpack-asset-relocator-loader', (compilation) => {
        relocateLoader.initAssetCache(compilation, 'native_modules');
      });
    },
  },
  new AssetRelocatorPatch.default(false, false),
];

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  module: {
    rules,
  },
  plugins: mainPlugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
