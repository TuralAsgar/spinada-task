import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
    {
        ignores: [
            // Generated files
            'src/types/api.generated.ts',
            // Dependencies
            'node_modules/**',
            // Build output
            'dist/**',
            'build/**',
        ],
    },
    {
        files: ['**/*.ts'],
        plugins: {
            '@typescript-eslint': typescript,
            prettier,
        },
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                sourceType: 'module',
            },
            globals: {
                process: true,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...typescript.configs.recommended.rules,
            'no-console': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-function-return-type': 'error',
            'complexity': ['warn', 16],
            'max-len': ['warn', {
                code: 120,
                tabWidth: 4,
                ignoreComments: true,
                ignoreTrailingComments: true,
            }],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            'prettier/prettier': [
                'error',
                {
                    semi: true,
                    trailingComma: 'all',
                    singleQuote: true,
                    printWidth: 120,
                    tabWidth: 2,
                    useTabs: false,
                },
            ],
            "prefer-const": ["error", {
                "destructuring": "all", // Enforce `const` even in destructuring assignments
            }],
        },
    },
];