const path = require('path');
const fs = require('fs');
const { spawnSync: spawn } = require('child_process');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const mode = process.env.NODE_ENV || 'production';
const bin = {
  'stdlib-external/runtime': fs.readFileSync(path.resolve(__dirname, 'lib/stdlib-external/runtime.gr.wasm')),
};
let compile = 'ready';

module.exports = {
  mode,
  context: path.resolve(__dirname, '.'),
  entry: [
    './lib/shims.js',
    './index.js'
  ],
  target: 'webworker',
  node: {
    fs: 'empty',
  },
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.compilation.tap('grain-compile', compilation => {
          if (compile !== 'ready') return;

          const result = spawn('grain', ['compile', 'main.gr'], { stdio: 'inherit' });
          if (result.status != 0) {
            compilation.errors.push('grain compile failed');
          } else {
            console.log('grain compile successfully');
          }
          compile = 'done';
        });
      },
    },
    new webpack.ProvidePlugin({
      wasiBindings: '@wasmer/wasi/lib/bindings/browser',
    }),
    new webpack.DefinePlugin({
      __RUNTIME_BROWSER: JSON.stringify(true),
      __RUNTIME_STDLIB_EXTERNAL: JSON.stringify(bin['stdlib-external/runtime'].toString('base64')),
    }),
    new CopyPlugin([
      // Note: Grain runner requires `stdlib-external/runtime` wasm module, But Wrangler only supports loading a single wasm asset.
      // TODO: Need to figure out a way to link stdlib within the target module statically.
      // Or, I think it probably can be done in this webpack configuration.
      { from: './main.gr.wasm', to: './worker/main.wasm' },
    ]),
  ],
};
