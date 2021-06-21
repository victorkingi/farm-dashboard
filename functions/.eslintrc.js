module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parser: "@babel/eslint-parser",
  rules: {
    quotes: "off",
    indent: "off",
    "linebreak-style": "off",
    "comma-dangle": "off",
    semi: "off",
    "require-jsdoc": "off",
    "max-len": "off",
    "new-cap": "off",
    "spaced-comment": "off",
    "arrow-parens": "off",
    "no-prototype-builtins": "off",
    "space-before-function-paren": "off",
    "keyword-spacing": "off",
    "prefer-const": "off",
    "padded-blocks": "off",
    "brace-style": "off",
    "block-spacing": "off",
    "object-curly-spacing": "off",
    "quote-props": "off",
    camelcase: "off",
    "comma-spacing": "off",
    "no-extra-semi": "off",
    "array-bracket-spacing": "off",
    "func-call-spacing": "off",
    "space-before-blocks": "off",
    "operator-linebreak": "off",
    "eol-last": "off",
    "no-multi-spaces": "off",
    "no-inner-declarations": "off",
    "no-unused-vars": "off",
    "no-unreachable": "off"
  },
  parserOptions: {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true
    }
  }
};
