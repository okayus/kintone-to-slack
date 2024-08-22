module.exports = {
  extends: ["@cybozu/eslint-config/presets/react-typescript-prettier"],
  plugins: ["import"],
  settings: {
    // settings for typescript
    "import/resolver": {
      typescript: true,
      node: true,
    },
    "import/extensions": [".js", ".ts", ".jsx", ".tsx"],
  },
  rules: {
    // disable original eslint sort imports
    "sort-imports": [
      "error",
      { ignoreCase: true, ignoreDeclarationSort: true },
    ],
    // order imports depend on groups below and alphabetize with import path.
    // import without name such as `import "../../../hoge.css"` can not lint. please put at bottom manually.
    "import/order": [
      "error",
      {
        // sort depend on following group order
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
          "type",
        ],
        pathGroups: [
          {
            pattern:
              "{react,react-dom/**,react-redux/**,react-redux, styled-components}",
            group: "builtin",
            position: "before",
          },

          {
            pattern: "@desktop/**",
            group: "external",
            position: "after",
          },
          {
            pattern: "@assets/**",
            group: "external",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        "newlines-between": "always",
      },
    ],
  },
};
