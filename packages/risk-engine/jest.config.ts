import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@shared-types/(.*)$": "<rootDir>/../../shared-types/$1",
  },
};

export default config;
