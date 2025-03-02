import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['coverage/', 'node_modules/', 'dist/'],
  },
  // Base configurations
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        process: true,
        console: true,
        jest: true,
        expect: true,
        describe: true,
        it: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
        Buffer: true,
        __dirname: true,
        setTimeout: true,
        module: true,
        NodeJS: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      'import/prefer-default-export': 0,
      'import/extensions': 0,
      'import/no-named-as-default': 0,
      'class-methods-use-this': 0,
      'import/no-unresolved': 0,
      'import/no-extraneous-dependencies': 0,
      'no-underscore-dangle': 0,
      'max-classes-per-file': 0,
      'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
        },
      ],
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];
