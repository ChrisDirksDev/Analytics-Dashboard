module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    // The existing dashboard switch scopes declarations by discriminated union.
    'no-case-declarations': 'off',
    // ThemeContext intentionally exports both its provider and consumer hook.
    'react-refresh/only-export-components': 'off',
  },
}
