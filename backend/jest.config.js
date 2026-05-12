/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/tests/**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    setupFiles: ['dotenv/config'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/server.ts',
        '!src/test-setup.ts',
        '!src/generated/**',
    ],
    coverageThreshold: {
        global: {
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80,
        },
    },
};

module.exports = config;
