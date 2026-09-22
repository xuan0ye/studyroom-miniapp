const http = uni.$u.http

/**
 * 通过临时登录code 换取用户的openid
 * @param {code} params 
 * @param {*} config 
 */
export const login = (params, config = {}) => http.post('/api/wx/login', params, config)

/**
 * 通过临时code（和登录临时code不一样）获取用户手机号
 * @param {code} params 
 * @param {*} config 
 */
export const phone = (params, config = {}) => http.post('/api/wx/phone', params, config)

/**
 * encryptedData:用户加密信息
 * ivStr:加密算法的初始向量
 * @param {*} encryptedData
 * @param {*} ivStr 
 */
export const userInfo = (params, config = {}) => http.post('/api/wx/userInfo', params, config)

/**
 * 上传用户头像(Base64)
 * @param {*} params { avatarUrl: base64 }
 */
export const uploadAvatar = (params, config = {}) => http.post('/api/wx/user/avatar', params, config)

/**
 * 获取当前登录用户资料(含已保存的头像/昵称)
 */
export const getUserProfile = (params, config = {}) => http.get('/api/wx/user', { params, ...config })

/**
 * 更新用户信息(昵称等)
 * @param {*} params { nickname }
 */
export const updateUser = (params, config = {}) => http.put('/api/wx/user', params, config)

/**
 * 获取用户账户余额
 * @param {*} params 
 */
export const getBalance = (params, config = {}) => http.get('/api/wx/user/balance', { params, ...config })

/**
 * 获取用户账户拥有的优惠卡
 * @param {} params 
 */
export const getCard = (params, config = {}) => http.get('/api/wx/common/card', { params, ...config })

/**
 * 获取用户已购买的优惠卡(含日卡)
 * @param {*} params
 * @param {*} config
 */
export const getMyCard = (params, config = {}) => http.get('/api/wx/user/card', { params, ...config })

/**
 * 获取用户所有消费订单
 * @param {*} params 
 */
export const getOrder = (params, config = {}) => http.get('/api/wx/user/order', { params, ...config })

/**
 * 获取用户所有已消费订单 
 * @param {*} params 
 */
export const getLearnRecord = (params, config = {}) => http.get('/api/wx/user/order/paid', { params, ...config })

/**
 * 获取用户自己的累计学习小时数
 * @param {*} params 
 */
export const getRecordHousrs = (params, config = {}) => http.get('/api/wx/user/record/mine', { params, ...config })

/**
 * 获取学习记录排行榜
 * @param {*} params 
 */
export const getRecordRank = (params, config = {}) => http.get('/api/wx/user/record', { params, ...config })

/**
 * 连续签到排行榜(按连续签到天数)
 * @param {*} params 
 */
export const getStreakRank = (params, config = {}) => http.get('/api/wx/user/record/streak', { params, ...config })

/**
 * 今日早到排行榜(按当天首次开灯时间)
 * @param {*} params 
 */
export const getEarlyRank = (params, config = {}) => http.get('/api/wx/user/record/early', { params, ...config })

/**
 * 获取轮播图
 * @param {*} params 
 */
export const getSwiper = (params, config = {}) => http.get('/api/wx/common/swiper', { params, ...config })

/**
 * 获取首页热门活动(后台「门店管理-热门活动」维护, 公开接口)
 * @param {*} params 
 */
export const getPromoList = (params, config = {}) => http.get('/api/wx/common/promo', { params, ...config })

/**
 * 获取轮播图
 * @param {*} params 
 */
export const getStore = (params, config = {}) => http.get('/api/wx/common/store', { params, ...config })

/**
 * 获取当前时间段的座位详情
 * @param {*} params 
 * @param {*} config 
 */
export const getSeat = (params, config = {}) => http.post('/api/wx/common/seat', params, config)

/**
 * 读取座位布局坐标(服务器端, 所有设备共享)
 * @param {*} params { roomId }
 */
export const getSeatPositions = (params, config = {}) => http.get('/api/wx/common/seatPositions', { params, ...config })

/**
 * 保存座位布局坐标(同步到服务器)
 * @param {*} params { roomId, positions: JSON字符串 }
 */
export const saveSeatPositions = (params, config = {}) => http.post('/api/wx/common/seatPositions', params, config)

/**
 * 预定座位
 * @param {*} params 
 * @param {*} config 
 */
export const orderSeat = (params, config = {}) => http.post('/api/wx/pay/order/seat', params, config)

/**
 * 消费座位
 * @param {*} params 
 * @param {*} config 
 */
export const orderSeatConsumed = (params, config = {}) => http.put('/api/wx/pay/order/seat/consumed', params, config)

/**
 * 余额充值
 * @param {*} params 
 * @param {*} config 
 */
export const balanceRecharge = (params, config = {}) => http.post('/api/wx/pay/createOrder/recharge', params, config)

/**
 * 获取所有优惠卡列表
 * @param {*} params 
 * @param {*} config 
 */
export const cardList = (params, config = {}) => http.get('/api/wx/common/card', { params, ...config })

/**
 * 购买优惠卡
 * @param {*} params
 * @param {*} config
 */
export const payCard = (params, config = {}) => http.post('/api/wx/pay/createOrder/card', params, config)

/**
 * 双人卡: 好友用自己账号兑换(同伴购买的兑换码)
 * @param {*} params { code }
 */
export const redeemCard = (params, config = {}) => http.post('/api/wx/card/redeem', params, config)

/**
 * 双人卡: 我购买的兑换码(购买者分享给同伴)
 */
export const myRedeemCodes = (config = {}) => http.get('/api/wx/card/redeem/mine', config)
/**
 * 查询订单支付状态(支付后轮询兜底)
 * @param {*} orderId
 * @param {*} config
 */
export const queryOrder = (orderId, config = {}) => http.get('/api/wx/pay/query/' + orderId, config)

/**
 * 获取座位绑定的设备列表
 * @param {*} params
 */
export const getSeatDevices = (params, config = {}) => http.get('/api/wx/device/mine', { params, ...config })

/**
 * 获取房间所有设备
 * @param {*} params
 */
export const getRoomDevices = (params, config = {}) => http.get('/api/wx/device/room', { params, ...config })

/**
 * 控制设备开关
 * @param {*} params
 * @param {*} config
 */
export const controlDevice = (params, config = {}) => http.post('/api/wx/device/control', params, config)

/**
 * 打开座位电源
 * @param {*} params
 */
export const seatPowerOn = (params, config = {}) => http.post('/api/wx/device/seat/on', null, { ...config, params })

/**
 * 关闭座位电源
 * @param {*} params
 */
export const seatPowerOff = (params, config = {}) => http.post('/api/wx/device/seat/off', null, { ...config, params })

/**
 * 日卡下单(使用日卡预约座位)
 * @param {*} params
 * @param {*} config
 */
export const dailyOrder = (params, config = {}) => http.post('/api/wx/daily/order', params, config)

/**
 * 查询今日预约状态
 * @param {*} params
 */
export const dailyStatus = (params, config = {}) => http.get('/api/wx/daily/status', { params, ...config })
export const myBookings = (params, config = {}) => http.get('/api/wx/daily/record', { params, ...config })

/**
 * 我今天的座位(覆盖周卡/月卡锁座期 + 今日预约), 用于主页灯控按钮
 */
export const myTodaySeat = (config = {}) => http.get('/api/wx/daily/today', config)

/**
 * 取消预约(日卡/周卡不退款, 长期卡按剩余比例退余额)
 * @param {*} params { id }
 * @param {*} config
 */
export const cancelBooking = (params, config = {}) => http.post('/api/wx/daily/cancel', params, config)

/**
 * 获取日卡配置(价格等)
 * @param {*} params
 */
export const dailyConfig = (params, config = {}) => http.get('/api/wx/daily/config', { params, ...config })

/**
 * 锁定订阅座位
 * @param {*} params
 * @param {*} config
 */
export const subscriptionLock = (params, config = {}) => http.post('/api/wx/subscription/lock', params, config)

/**
 * 解锁订阅座位
 * @param {*} params
 * @param {*} config
 */
export const subscriptionUnlock = (params, config = {}) => http.post('/api/wx/subscription/unlock', params, config)

/**
 * 获取我的订阅列表
 * @param {*} params
 */
export const subscriptionMine = (params, config = {}) => http.get('/api/wx/subscription/mine', { params, ...config })

/**
 * 续费订阅
 * @param {*} params
 * @param {*} config
 */
export const subscriptionRenew = (params, config = {}) => http.post('/api/wx/subscription/renew', params, config)

/**
 * ============ 学习排行榜 ============
 */

/**
 * 上传门禁人脸照片并同步到门禁设备
 * @param {*} params { facePhotoBase64, roomId }
 */
export const accessFaceUpload = (params, config = {}) => http.post('/api/wx/access/profile/upload', params, config)

/**
 * 查询当前用户门禁档案
 * @param {*} params { roomId }
 */
export const accessProfile = (params, config = {}) => http.get('/api/wx/access/profile/current', { params, ...config })

/**
 * 远程开门(仅当日有效预约用户)
 * @param {*} params { roomId }
 */
export const accessOpenDoor = (params, config = {}) => http.post('/api/wx/access/door/open', null, { ...config, params })

/**
 * 查询我的积分(含流水)
 */
export const myPoints = (params, config = {}) => http.get('/api/wx/points/mine', { params, ...config })

/**
 * 提交意见反馈
 * @param {*} params { content, contact }
 */
export const submitFeedback = (params, config = {}) => http.post('/api/wx/points/feedback', params, config)

/**
 * 我的反馈列表
 */
export const myFeedback = (params, config = {}) => http.get('/api/wx/points/feedback/list', { params, ...config })

/**
 * ============ 抖音团购核销 ============
 */

/**
 * 抖音团购券验券(预校验): 校验券码/短链并创建核销会话
 * @param {*} params { code: 明文券码, shortLink: 抖音分享短链 } 二选一, code 优先
 * @param {*} config
 */
export const douyinPrepare = (params, config = {}) => http.post('/api/wx/douyin/prepare', params, config)

/**
 * 抖音团购券核销: 核销成功后自动发放使用卡
 * @param {*} params { sessionId, seatId(可选,本期不传) }
 * @param {*} config
 */
export const douyinVerify = (params, config = {}) => http.post('/api/wx/douyin/verify', params, config)

/**
 * 我的抖音团购核销记录
 * @param {*} params { pageNum, pageSize }
 * @param {*} config
 */
export const douyinRecords = (params, config = {}) => http.get('/api/wx/douyin/records', { params, ...config })
