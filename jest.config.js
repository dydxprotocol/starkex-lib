module.exports = {
  /* eslint-disable global-require */
  preset: "ts-jest",
  roots: ["<rootDir>/tests"],
  testRegex: "tests\\/.*\\.test\\.ts$",
  moduleFileExtensions: ["js", "ts", "json", "node"],
  resetMocks: true,
  setupFilesAfterEnv: ["./jest.setup.js"],
  testEnvironment: "node",
  testTimeout: 30000,
};
