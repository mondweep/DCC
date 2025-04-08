module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  // setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleDirectories: ["node_modules"],
};