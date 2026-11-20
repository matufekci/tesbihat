import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'android/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', fetch: 'readonly', console: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
        URL: 'readonly', Intl: 'readonly', Date: 'readonly', Math: 'readonly', JSON: 'readonly',
        Promise: 'readonly', Map: 'readonly', Set: 'readonly', Number: 'readonly', String: 'readonly',
        Array: 'readonly', Object: 'readonly', Error: 'readonly', RegExp: 'readonly',
        self: 'readonly', caches: 'readonly', importScripts: 'readonly',
        process: 'readonly', __dirname: 'readonly', require: 'readonly', module: 'readonly',
        globalThis: 'readonly', AbortController: 'readonly', ResizeObserver: 'readonly',
        Notification: 'readonly', AudioContext: 'readonly', webkitAudioContext: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', __dirname: 'readonly' } },
  },
]
