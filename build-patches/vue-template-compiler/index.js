// 补丁：@dcloudio/uni-template-compiler 的 compile 不输出 recyclableRender/components 定义，
// 但 @dcloudio/vue-cli-plugin-uni 的 templateLoader 会无条件导出这三个变量，导致 webpack 报错。
// 这里在编译产物末尾补上定义（mp 平台不使用 recyclableRender，置 null 即可）。
const real = require('@dcloudio/uni-template-compiler')

const originalCompile = real.compile

real.compile = function (source, options) {
  const res = originalCompile.call(this, source, options)
  if (res && res.code && res.code.indexOf('recyclableRender') === -1) {
    res.code = res.code + '\nvar recyclableRender = null\nvar components = ' + JSON.stringify(res.components || {}) + '\n'
  }
  return res
}

module.exports = real