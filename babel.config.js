module.exports = {
  presets: [['@vue/cli-plugin-babel/preset', { useBuiltIns: 'entry' }]],
  // 生产构建自动剔除 console.log 等调试输出, 开发环境保留
  // 保留 console.error/console.warn, 线上排障不丢关键错误信息
  plugins: process.env.NODE_ENV === 'production'
    ? [['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]]
    : []
}
