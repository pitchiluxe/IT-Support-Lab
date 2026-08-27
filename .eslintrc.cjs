/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: '18.3' } },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs', 'vite.config.ts', 'tailwind.config.cjs', 'postcss.config.cjs'],
  rules: {
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    'jsx-a11y/label-has-associated-control': ['error', { required: { some: ['nesting', 'id'] } }],
  },
};
