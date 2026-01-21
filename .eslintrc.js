const { resolve } = require('node:path');

const project = resolve(__dirname, 'tsconfig.json');

module.exports = {
  root: true,
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/react'),
    require.resolve('@vercel/style-guide/eslint/next'),
  ],
  parserOptions: {
    project,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  overrides: [
    {
      // For JavaScript files, use default parser instead of TypeScript parser
      files: ['*.js', '*.jsx'],
      parser: 'espree', // Default ESLint parser
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        // Disable TypeScript-specific rules for JS files
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
      },
    },
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true,
      },
    ],
    '@typescript-eslint/no-shadow': [
      'error',
      {
        ignoreOnInitialization: true,
      },
    ],
    'import/newline-after-import': 'error',
    'react/jsx-uses-react': 'error',
    'react/react-in-jsx-scope': 'error',
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          kebabCase: true, // personal style
          pascalCase: true,
        },
      },
    ],

    // Deactivated
    '@typescript-eslint/dot-notation': 'off', // paths are used with a dot notation
    '@typescript-eslint/no-misused-promises': 'off', // onClick with async fails
    '@typescript-eslint/no-non-null-assertion': 'off', // sometimes compiler is unable to detect
    '@typescript-eslint/no-unnecessary-condition': 'off', // remove when no static data is used
    '@typescript-eslint/require-await': 'off', // Server Actions require async flag always
    '@typescript-eslint/prefer-nullish-coalescing': 'off', // personal style
    'import/no-default-export': 'off', // Next.js components must be exported as default
    'import/no-extraneous-dependencies': 'off', // conflict with sort-imports plugin
    'import/order': 'off', // using custom sort plugin
    'no-nested-ternary': 'off', // personal style
    'no-redeclare': 'off', // conflict with TypeScript function overloads
    'react/jsx-fragments': 'off', // personal style
    'react/prop-types': 'off', // TypeScript is used for type checking

    '@next/next/no-img-element': 'off', // Temporary disabled
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    'no-console': 'off',
    'react/function-component-definition': 'off',
    'import/no-cycle': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-implicit-coercion': 'off',
    'prefer-const': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    'no-else-return': 'off',
    'react/jsx-no-leaked-render': 'off',
    'react/jsx-boolean-value': 'off',
    'object-shorthand': 'off',
    'func-names': 'off',
    'no-lonely-if': 'off',
    'eslint-comments/require-description': 'off',
    'prefer-named-capture-group': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',
    'react/hook-use-state': 'off',
    'import/no-named-as-default-member': 'off',
    'tsdoc/syntax': 'off',
    'react/no-array-index-key': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'react/jsx-curly-brace-presence': 'off',
    'prefer-template': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
    '@typescript-eslint/no-unnecessary-template-expression': 'off',
    'no-undef': 'off',
    'import/no-named-as-default': 'off',
    '@typescript-eslint/no-unnecessary-type-arguments': 'off',
    '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    'no-empty': 'off',
    'no-useless-return': 'off',
    'react/self-closing-comp': 'off',
    'import/no-unresolved': 'off',
    'import/no-duplicates': 'off',
    'no-alert': 'off',
    'react/button-has-type': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    'react/display-name': 'off',
    'no-prototype-builtins': 'off',
    'import/first': 'off',
  }
}