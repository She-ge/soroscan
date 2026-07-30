/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',

  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      { configFile: './babel.config.jest.js' },
    ],
  },

  // Load @testing-library/jest-dom matchers before each test file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  testMatch: [
    '**/app/components/__tests__/**/*.test.tsx',
    '**/app/components/__tests__/**/*.test.ts',
  ],

  // Skip the ProgressBar.test.mjs (uses node:test runner, not Jest)
  testPathIgnorePatterns: ['/node_modules/', '\\.mjs$'],

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],

  transformIgnorePatterns: [
    'node_modules/(?!(recharts|d3-.*|internmap|delaunator|robust-predicates)/)',
  ],
};

module.exports = config;
