const globals = require('globals');
const pluginJs = require('@eslint/js');
const prettierPlugin = require('eslint-plugin-prettier');
const pluginJest = require('eslint-plugin-jest');
const importPlugin = require('eslint-plugin-import');

const { node } = globals;

module.exports = [
  pluginJs.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    files: ['**/*.js'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...node,
        filePath: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2020,
      },
    },
    rules: {
      'no-console': 'off',
      'no-process-env': 'off',
      'no-process-exit': 'off',
      'no-sync': 'off',

      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'max-lines': ['error', 250],
      'max-lines-per-function': ['error', 42],
      'import/no-dynamic-require': 'warn',
      'import/no-nodejs-modules': 'warn',
      'no-unused-expressions': 'error',
      'import/no-cycle': 'error',

      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'prefer-const': 'error',
      'no-var': 'error',

      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',

      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],

      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
  {
    files: ['**/*.test.js'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
  },
];
