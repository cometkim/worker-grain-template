const path = require('path');
const fs = require('fs');
const { spawnSync: spawn } = require('child_process');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const mode = process.env.NODE_ENV || 'production';
let compile = 'ready';

module.exports = {
  mode,
  context: path.resolve(__dirname, '.'),
  entry: [
    './lib/shims.js',
    './index.js',
  ],
  node: {
    fs: 'empty',
  },
  target: 'webworker',
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.compilation.tap('grain-compile', compilation => {
          if (compile !== 'ready') return;

          const result = spawn('grain', [
            'compile',
            '--stdlib=node_modules/@grain/stdlib',
            'main.gr',
          ], { stdio: 'inherit' });

          if (result.status != 0) {
            compilation.errors.push('grain compile failed');
          } else {
            console.log('grain compile successfully');
          }

          compile = 'done';
        });
      },
    },
    new CopyPlugin([
      { from: './main.gr.wasm', to: './worker/main.wasm' },
    ]),
  ],
};
