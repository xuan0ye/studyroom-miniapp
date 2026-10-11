// 正常参数为页面的实例，可以通过它引用vuex中的变量
const appConfig = require('./config.js')

// 是否正在重新登录（防止多个401并发时重复触发重登）
let reloginPromise = null

// 判断是否是登录接口本身（避免重登死循环）
function isLoginApi(url) {
	return typeof url === 'string' && url.indexOf('/api/wx/login') !== -1
}

// 静默重新登录：wx.login 换取新 token
function relogin() {
	if (!reloginPromise) {
		reloginPromise = new Promise((resolve, reject) => {
			uni.login({
				provider: 'weixin',
				success(res) {
					// 本地联调: dev 环境且开启 devMockLogin 时使用模拟 code
					const code = (process.env.NODE_ENV !== 'production' && appConfig.devMockLogin) ? 'mock-demo' : res.code
					uni.$u.http.post('/api/wx/login', {
						code: code
					}, {
						header: {
							'content-type': 'application/x-www-form-urlencoded'
						},
						custom: {
							toast: false,
							catch: true
						}
					}).then((data) => {
						const token = data && data.data ? data.data.token : (data && data.token)
						if (token) {
							uni.setStorageSync('token', token)
							uni.setStorageSync('isLogin', true)
							// 静默登录也可能第一次建号: 挂标记, 由 utils/user-guide.js 的 runUserGuide() 消费
							// (key 字面量与 user-guide.js 保持一致, 那边不反向 import 本文件以免循环依赖)
							if (data && data.data && data.data.newUser) {
								uni.setStorageSync('pendingNewUserGuide', 1)
							}
							resolve(token)
						} else {
							reject(new Error('登录响应缺少 token'))
						}
					}).catch((err) => {
						reject(err)
					})
				},
				fail(err) {
					reject(err)
				}
			})
		})
		reloginPromise.then(() => {
			reloginPromise = null
		}, () => {
			reloginPromise = null
		})
	}
	// 给"重登本身失败"打标记 —— 只有这种情况才该清掉本地登录态。
	// 调用方必须区分"重登失败"与"重放请求失败", 见 handleUnauthorized。
	return reloginPromise.catch((e) => {
		const err = new Error((e && (e.msg || e.errMsg || e.message)) || '重新登录失败')
		err.reloginFailed = true
		throw err
	})
}

// 递归归一化所有头像字段: 后端可能返回裸 base64(缺 data:image 前缀), 统一补前缀,
// 避免 image/u-avatar 组件把裸 base64 当 URL 加载报错 —— 全局兜底, 覆盖所有页面/接口
// /upload/ 相对路径按当前运行环境拼域名(dev=本地后端, prod/真机=线上), 与请求 baseURL 保持一致
// 初值即生产域名, 避免冷路径(响应先于 resolveBaseURL 执行)拼到本地地址
let gBaseOrigin = 'https://api.dayousuoan.top'
function normalizeAvatarFields(obj) {
	if (!obj || typeof obj !== 'object') return obj
	if (Array.isArray(obj)) {
		obj.forEach(function(item) { normalizeAvatarFields(item) })
		return obj
	}
	Object.keys(obj).forEach(function(key) {
		var val = obj[key]
		if (typeof val === 'string' && /avatar/i.test(key) && val) {
			// 服务器本地存储头像(/upload/...) → 按当前环境拼根地址(否则小程序当本地路径加载失败)
			if (val.indexOf('/upload/') === 0) {
				obj[key] = gBaseOrigin + val
				return
			}
			// 归一化裸 base64: 兼容缺 data:image 前缀, 以及 data URI 截断残留的 /9j/... 前导斜杠形式
			var t = val
			if (t.indexOf('data:image') === 0) return
			if (t.indexOf('http') === 0 || t.indexOf('wxfile') === 0) return
			if (t.indexOf('/') === 0) t = t.slice(1)
			if (/^[A-Za-z0-9+/=]+$/.test(t) && t.length > 50) {
				obj[key] = 'data:image/jpeg;base64,' + t
			}
		} else if (val && typeof val === 'object') {
			normalizeAvatarFields(val)
		}
	})
	return obj
}

// 处理 401：自动重新登录后用新 token 重放原请求
function handleUnauthorized(response, data, custom) {	const config = response && response.config ? response.config : {}
	const url = config.url || ''
	// 登录接口自身失败不触发重登
	if (!isLoginApi(url) && !(custom && custom._reloginRetried)) {
		return relogin().then(() => {
			// 用新 token 重放原请求
			return uni.$u.http.request({
				...config,
				custom: {
					...config.custom,
					_reloginRetried: true
				}
			})
		}).catch((err) => {
			// ⚠ 必须区分两种失败(2026-10-11 修):
			//   ① 重登本身失败(err.reloginFailed) → 确实登录失效, 清掉本地登录态并提示;
			//   ② 重放请求失败(弱网 / 5xx / 并发被顶下线) → 只是这一次请求没成, **绝不能删 token**。
			// 老代码把两者写在同一个 catch 里, 于是任何一次重放失败都会 removeStorageSync('token'),
			// 表现就是"明明登录着, 进预约页却提示请先登录, 回我的页退出重登一次才好" —— 这个 bug 反复出现过。
			if (err && err.reloginFailed === true) {
				uni.removeStorageSync('token')
				uni.removeStorageSync('isLogin')
			}
			if (!custom || (custom.toast !== false && !custom.catch)) {
				uni.$u.toast("登录已过期，请重新登录")
			}
			return Promise.reject(data)
		})
	}
	if (!custom || (custom.toast !== false && !custom.catch)) {
		uni.$u.toast("登录已过期，请重新登录")
	}
	return Promise.reject(data)
}

module.exports = (vm) => {
	// 统一走线上后端: 模拟器/真机/发行全部连 api.dayousuoan.top,
	// 无需维护本地 MySQL/Redis/后端, 调试与线上数据一致
	// 如需本地联调, 在 config.js 设 useLocalDev=true 后走 devHost
	function resolveBaseURL() {
		gBaseOrigin = appConfig.prodHost
		return appConfig.prodHost
	}
	// 初始化请求配置
	uni.$u.http.setConfig((config) => {
		/* config 为默认全局配置*/
		config.baseURL = resolveBaseURL(); /* 根域名*/
		return config
	})

	// 请求拦截
	uni.$u.http.interceptors.request.use((config) => { // 可使用async await 做异步操作
		// 初始化请求拦截器时，会执行此方法，此时data为undefined，赋于默认值
		config.data = config.data || {}

		// 根据custom参数中配置的是否需要token，添加对应的请求头
		if (config?.custom?.auth) {
			// 可以通过vm引用vuex中的变量，具体值在vm.$store.state中
			config.header.Authorization = 'Bearer ' + uni.getStorageSync("token")
		}
		return config
	}, config => { // 可使用async await 做异步操作
		return Promise.reject(config)
	})

	// 响应拦截
	uni.$u.http.interceptors.response.use((response) => {
		/* 对响应成功做点什么（自定义参数处理）*/
		const data = response.data
		const custom = response.config?.custom
		if (data.code !== 200) {
			if (data.code == 401) {
				return handleUnauthorized(response, data, custom)
			}
			// 如果没有显示定义custom的toast参数为false的话，默认对报错进行toast弹出提示
			// catch:true 表示调用方自行处理错误，不再重复 toast
			if (custom.toast !== false && !custom.catch) {
				uni.$u.toast(data.msg)
			}
			// 如果需要catch返回，则进行reject
			return Promise.reject(data)
		}
		// 成功: 全局归一化返回数据中的头像字段(裸 base64 → data:image 前缀)
		if (data.data && typeof data.data === 'object') {
			normalizeAvatarFields(data.data)
			// 若响应含 userId(用户资料/登录等), 存入本地供"我的排名"等按 userId 匹配
			if (data.data.userId != null) {
				uni.setStorageSync('userId', String(data.data.userId))
			}
		}
		return data.data == undefined ? {
			data: data
		} : data
	}, (response) => {
		// 对响应错误做点什么（网络异常、超时、statusCode !== 200）
		const data = response && response.data ? response.data : {}
		const custom = response?.config?.custom || {}
		if (data.code == 401) {
			return handleUnauthorized(response, data, custom)
		}
		const message = data.msg || response?.errMsg || '网络异常，请稍后重试'
		if (custom.toast === false || custom.catch) {
			return Promise.reject(data.code ? data : {
				code: -1,
				msg: message
			})
		}
		uni.$u.toast(message)
		return Promise.reject(data.code ? data : {
			code: -1,
			msg: message
		})
	})
}