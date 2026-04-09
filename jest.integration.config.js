/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
  globalSetup: "<rootDir>/tests/integration/global-setup.ts",
  globalTeardown: "<rootDir>/tests/integration/global-teardown.ts",
};
