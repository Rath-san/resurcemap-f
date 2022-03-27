module.exports = {
  env: {
    node: true,
  },
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "prettier"],
  rules: {
    'vue/no-unused-vars': 'warn',
    'no-unused-vars': 'warn'
  },
};
