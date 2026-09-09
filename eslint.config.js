import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'legacy/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Project rule: styling lives in the component CSS file, never inline.
      'react/forbid-dom-props': ['error', { forbid: ['style'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The domain layer must not reach into the outer layers or the browser.
    files: ['src/domain/**/*.js'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/infrastructure/**'], message: 'domain must not import infrastructure' },
            { group: ['**/presentation/**'], message: 'domain must not import presentation' },
            { group: ['three'], message: 'domain must stay framework free' },
            { group: ['react', 'react-*'], message: 'domain must stay framework free' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'domain must not touch the browser' },
        { name: 'document', message: 'domain must not touch the browser' },
        { name: 'localStorage', message: 'domain must not touch the browser' },
        { name: 'fetch', message: 'domain must not touch the network' },
      ],
    },
  },
  {
    // Infrastructure adapts the outside world, it must not know the UI.
    files: ['src/infrastructure/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/presentation/**'],
              message: 'infrastructure must not import presentation',
            },
          ],
        },
      ],
    },
  },
];
