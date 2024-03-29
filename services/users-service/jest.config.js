/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  preset: '@shelf/jest-dynamodb',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['.terragrunt-cache', '.terraform', '/dist/'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
