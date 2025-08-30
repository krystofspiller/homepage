import js from "@eslint/js"
import typescript from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import type { Linter } from "eslint"
import eslintPluginAstro from "eslint-plugin-astro"
import importPlugin from "eslint-plugin-import"
import globals from "globals"

const astroLanguageOptions: Linter.LanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
  globals: {
    ...globals.browser,
    ...globals.es2022,
    ...globals.node,
  },
}

const astroLanguageRules: Linter.RulesRecord = {
  "no-unused-vars": "off",
  "no-console": "warn",
  "no-debugger": "error",
  "prefer-const": "error",
  "no-var": "error",
}

export default [
  {
    ignores: ["dist/**", ".astro/**"],
  },
  js.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: astroLanguageOptions,
    rules: astroLanguageRules,
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ...astroLanguageOptions,
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      import: importPlugin,
    },
    rules: {
      ...astroLanguageRules,

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Import rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      // TypeScript handles this
      "import/no-unresolved": "off",
    },
  },
  {
    files: ["**/*.{test}.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.vitest,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
]
