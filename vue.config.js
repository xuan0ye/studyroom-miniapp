const path = require('path')
const fs = require('fs')

// 补丁 @vue/component-compiler-utils 的 compileTemplate：
// HBuilderX 内置模板 loader（templateLoader.js）会无条件导出
// recyclableRender/components，但内置的标准版 component-compiler-utils@3.3.0
// 不生成这两个声明，导致 webpack 报 "Export 'recyclableRender' is not defined"。
// loader 与本配置运行在同一个 Node 进程，共享 require.cache，因此这里直接
// 替换该模块的 compileTemplate 导出，为编译产物补上声明。
// Patch @vue/component-compiler-utils compileTemplate:
// HBuilderX's built-in template loader (templateLoader.js) unconditionally
// exports recyclableRender/components, but the standard component-compiler-utils@3.3.0
// does not generate these two declarations, causing webpack to report "Export 'recyclableRender' is not defined".
// More critically: the standard version drops the components code returned by
// uni-template-compiler (the easycom component's import(...)), causing component chunks to not be emitted.
// HBuilderX ships an official fork (packages/@vue/component-compiler-utils) that fully
// supports recyclableRender/components; the loader and this config run in the same Node process, sharing
// require.cache, so here we directly swap the standard version's compileTemplate export for the fork's implementation.
function patchComponentCompilerUtils () {
  var plugins = process.env.UNI_HBUILDERX_PLUGINS
  if (!plugins) return
  var searchPaths = [path.join(plugins, 'uniapp-cli/node_modules')]
  var ccuPath
  try {
    ccuPath = require.resolve('@vue/component-compiler-utils', { paths: searchPaths })
  } catch (e) {
    return
  }
  // The package entry index.js exposes compileTemplate via a read-only getter,
  // so we modify the underlying dist/compileTemplate.js (where it is a writable property).
  var distPath = path.join(path.dirname(ccuPath), 'compileTemplate.js')
  var ccuDist = require(distPath)
  if (!ccuDist || typeof ccuDist.compileTemplate !== 'function') return
  if (ccuDist.compileTemplate.__uniPatched) return
  // Use the fork's compileTemplate (same source as HBuilderX's native compilation), which supports recyclableRender/components
  var forkDistPath = path.join(
    plugins, 'uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/@vue/component-compiler-utils/dist/compileTemplate.js'
  )
  var forked
  try {
    forked = require(forkDistPath)
  } catch (e) {
    forked = null
  }
  if (forked && typeof forked.compileTemplate === 'function') {
    ccuDist.compileTemplate = forked.compileTemplate
  } else {
    // Fallback: if the fork is unavailable, degrade to appending placeholder declarations (compilable but missing component code)
    var original = ccuDist.compileTemplate
    ccuDist.compileTemplate = function (options) {
      var result = original(options)
      if (result && typeof result.code === 'string' && result.code.indexOf('recyclableRender') === -1) {
        result.code = result.code + '\nvar recyclableRender = false\nvar components = null\n'
      }
      return result
    }
  }
  ccuDist.compileTemplate.__uniPatched = true
  try {
    fs.writeFileSync(path.join(__dirname, 'unpackage', 'patch-debug.txt'), JSON.stringify({
      ccuPath: ccuPath,
      distPath: distPath,
      forkDistPath: forkDistPath,
      forkUsed: !!(forked && typeof forked.compileTemplate === 'function'),
      patched: true
    }, null, 2))
  } catch (e) {}
}

module.exports = {
  transpileDependencies: ['uview-ui'],
  configureWebpack: function (config) {
    // HBuilderX uniapp-cli 缩译时会移除 node_modules 瑭柉鏋愮洰褰?杩欓噷琛ュ洖鍏跺唴缃儇璧栧喎鐩褰?
    var plugins = process.env.UNI_HBUILDERX_PLUGINS
    if (plugins) {
      ;[
        path.join(plugins, 'uniapp-cli/node_modules'),
        path.join(plugins, 'compile-dart-sass/node_modules')
      ].forEach(function (m) {
        if (config.resolve.modules && config.resolve.modules.indexOf(m) === -1) {
          config.resolve.modules.push(m)
        }
      })
      // 瑙㈣浇鍣ㄨВ鏋?HBuilderX 缂栬瘧鍣ㄧ殑 loader 浠ユā鍧楈悕鍐欏叆(如 @dcloudio/webpack-uni-mp-loader/lib/main),
      // 榛樿.azure resolveLoader 浠庨」鐩 vars/css 目录解析涓嶅埌, 闇€瑕嗘寚鍚慏BuilderX 鍐咯缃 浚 зал── 鍓?
      if (config.resolveLoader) {
        var uniModules = path.join(plugins, 'uniapp-cli/node_modules')
        if (config.resolveLoader.modules) {
          if (config.resolveLoader.modules.indexOf(uniModules) === -1) {
            config.resolveLoader.modules.push(uniModules)
          }
        } else {
          config.resolveLoader.modules = ['node_modules', uniModules]
        }
      } else {
        config.resolveLoader = {
          modules: ['node_modules', path.join(plugins, 'uniapp-cli/node_modules')]
        }
      }
    }
    // babel-loader 缓存目录指向工作区可写位置(默认 node_modules/.cache 在受限沙箱下不可写,
    // 会导致 babel 未转译可选链等语法而编译失败); 同时强制指定项目 babel.config.js
    var babelCacheDir = process.env.UNI_BABEL_CACHE_DIR || ''
    var projectBabelConfig = path.join(__dirname, 'babel.config.js')
    if (babelCacheDir && config.module && config.module.rules) {
      var hits = []
      config.module.rules.forEach(function (rule) {
        if (!rule || !rule.use || !rule.use.length) return
        rule.use.forEach(function (u) {
          if (u && u.loader && String(u.loader).indexOf('babel-loader') > -1) {
            hits.push(u.loader + ' cache=' + (u.options && u.options.cacheDirectory))
            u.options = Object.assign({}, u.options || {}, {
              cacheDirectory: babelCacheDir,
              babelrc: false,
              configFile: projectBabelConfig
            })
          }
        })
      })
      try {
        fs.writeFileSync(path.join(__dirname, 'unpackage', 'cfg-babel.txt'), JSON.stringify(hits, null, 2))
      } catch (e) {}
    }
    patchComponentCompilerUtils()
    // 标记 configureWebpack 确实执行过，便于排查
    try {
      fs.writeFileSync(path.join(__dirname, 'unpackage', 'cfg-mark.txt'), 'ok')
    } catch (e) {}
  }
}