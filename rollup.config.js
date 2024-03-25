import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import pkg from './package.json' assert { type: 'json' }

import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import alias from '@rollup/plugin-alias'
import terser from '@rollup/plugin-terser'
import replace from '@rollup/plugin-replace'
import babel from '@rollup/plugin-babel'
import { optimizeLodashImports } from '@optimize-lodash/rollup-plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const __VERSION__ = pkg.version

const baseConfig = {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/contentful.cjs.js',
    format: 'cjs',
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      __VERSION__: JSON.stringify(__VERSION__),
    }),
    commonjs({
      sourceMap: false,
    }),
    nodeResolve({
      preferBuiltins: true,
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [['@babel/preset-env', { targets: pkg.browserslist }]],
    }),
    json(),
    optimizeLodashImports(),
  ],
}

const cjsConfig = {
  ...baseConfig,
  output: {
    ...baseConfig.output,
  },
  external: ['axios', '@contentful/rich-text-types', 'json-stringify-safe'],
}

const browserConfig = {
  ...baseConfig,
  output: {
    file: 'dist/contentful.browser.js',
    format: 'iife',
    name: 'contentful',
  },
  plugins: [
    ...baseConfig.plugins,
    nodePolyfills({
      include: ['util'],
    }),
    alias({
      entries: [
        {
          find: 'axios',
          replacement: resolve(__dirname, './node_modules/axios/dist/browser/axios.cjs'),
        },
      ],
    }),
  ],
}

const browserMinConfig = {
  ...browserConfig,
  output: {
    ...browserConfig.output,
    file: 'dist/contentful.browser.min.js',
  },
  plugins: [
    ...browserConfig.plugins,
    terser({
      compress: {
        ecma: 2017,
        module: true,
        toplevel: true,
        drop_console: true,
        drop_debugger: true,
        sequences: true,
        booleans: true,
        loops: true,
        unused: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
        collapse_vars: true,
        reduce_vars: true,
        pure_getters: true,
        // unsafe: true,
        // unsafe_comps: true,
        // unsafe_math: true,
        // unsafe_symbols: true,
        // unsafe_proto: true,
        // unsafe_undefined: true,
        // unsafe_methods: true,
        // unsafe_arrows: true,
        passes: 3, // The maximum number of times to run compress.
      },
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_/, // Only mangle properties that start with an underscore
        },
      },
      format: {
        comments: false, // Remove all comments
        beautify: false, // Minify output
      },
      module: true,
      toplevel: true,
      keep_classnames: false,
      keep_fnames: false,
    }),
  ],
}

export default [cjsConfig, browserConfig, browserMinConfig]
