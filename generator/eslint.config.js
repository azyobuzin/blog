import eslint from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import * as eslintPluginImport from "eslint-plugin-import"
import unicorn from "eslint-plugin-unicorn"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: ["dist/*"],
  },
  eslint.configs.recommended,
  eslintPluginImport.configs.typescript,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      // 雑JSX実装によりanyが多発しているのでチェックを無効化
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  {
    plugins: {
      import: eslintPluginImport,
      unicorn,
    },
    rules: {
      "sort-imports": [
        "error",
        {
          ignoreDeclarationSort: true,
        },
      ],
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc" },
        },
      ],
      "unicorn/no-instanceof-array": "error",
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-array-flat": "error",
      "unicorn/prefer-array-flat-map": "error",
      "unicorn/prefer-array-index-of": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/prefer-at": "error",
      "unicorn/prefer-date-now": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-negative-index": "error",
      "unicorn/prefer-object-from-entries": "error",
      "unicorn/prefer-object-has-own": "error",
      "unicorn/prefer-regexp-test": "error",
      "unicorn/prefer-string-slice": "error",
    },
  },
  eslintConfigPrettier,
)
