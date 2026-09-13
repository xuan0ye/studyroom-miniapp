
/**
 * 参数配置文件
 */
module.exports = {
  /**
	 * 应用名
	 */
  name: '答岸自习室',
  /**
	 * 版本
	 */
  version: '1.0.1',
  /**
	 * 开发环境host (用127.0.0.1而非localhost, 规避部分微信开发者工具模拟器localhost解析异常)
	 */
  devHost: 'http://127.0.0.1:8081',
  /**
	 * 测试环境转发规则
	 */
  devApi: '/dev-api',
  /**
	 * 生产环境host (线上服务器 HTTPS)
	 */
  prodHost: 'https://api.dayousuoan.top',
  /**
	 * 生产环境转发规则
	 */
  prodApi: '/prod-api',
  /**
	 * 请求头名称
	 */
  tokenHeadName: 'Authorization',

  /**
	 * 请求头类型
	 */
  tokenTypeName: 'Bearer ',

  /**
	 * 是否开启前端oss直传
	 */
  ossEnable: false,

  /**
	 * 本地联调模拟登录(仅开发环境生效, 生产环境自动忽略)
	 */
  devMockLogin: false,

  /**
	 * 微信公众号appid,填写即代表开启公众号登录
	 */
  wxH5AppId: '',

  /**
	 * 微信公众号授权方式snsapi_base或snsapi_userinfo
	 */
  wxH5scope: 'snsapi_base',

  /**
	 * 是否本地联调(默认false: 全部走线上后端; true: 模拟器走 devHost 本地后端)
	 */
  useLocalDev: false,

  /**
	 * 当前运行环境的根地址(默认统一线上, 供拼 /upload/ 等相对资源路径)
	 */
  currentHost() {
    if (this.useLocalDev && process.env.NODE_ENV !== 'production') {
      try {
        const sys = uni.getSystemInfoSync()
        if (sys && sys.platform && sys.platform === 'devtools') {
          return this.devHost
        }
      } catch (e) {}
    }
    return this.prodHost
  }
}
