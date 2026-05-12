const nextConfig = require('eslint-config-next');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
    ...nextConfig,
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'coverage/**',
            'dist/**',
        ],
    },
];
