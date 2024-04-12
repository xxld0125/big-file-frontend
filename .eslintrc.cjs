/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-prettier/skip-formatting'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['vue'],
  overrides: [
    {
      files: ['src/**/*.vue'], // 匹配views和二级目录中的index.vue
      rules: {
        'vue/multi-word-component-names': 'off'
      } //给上面匹配的文件指定规则
    }
  ]
};
