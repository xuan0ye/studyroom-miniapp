# StudyRoom uniCloud 云函数说明

本目录下的云函数是项目自有版本，可以上传到你自己的 uniCloud 服务空间。

## 微信云托管后端

当前小程序旧后端接口已经配置到微信云托管公网域名：

```text
环境 ID：prod-d7gzwm0mx4a8b7fe0
服务名：springboot-tna4
公网域名：https://springboot-tna4-279187-9-1331810718.sh.run.tcloudbase.com
```

`config/config.js` 中的 `devHost` 和 `prodHost` 都已指向该域名。正式上传小程序前，需要在微信公众平台后台添加 request 合法域名：

```text
https://springboot-tna4-279187-9-1331810718.sh.run.tcloudbase.com
```

如果使用 `wx.cloud.callContainer` 方式，则调用示例为：

```js
wx.cloud.callContainer({
  config: {
    env: 'prod-d7gzwm0mx4a8b7fe0'
  },
  path: '/api/count',
  header: {
    'X-WX-SERVICE': 'springboot-tna4'
  },
  method: 'POST',
  data: {
    action: 'inc'
  }
});
```

当前项目里的旧 HTTP 接口仍按公网域名方式调用，不需要逐个改成 `callContainer`。

## 上传顺序

1. 在 HBuilderX 中右键 `uniCloud-aliyun`，关联你的云服务空间。
2. 右键以下云函数目录，逐个选择“上传部署”：
   - `wx-login`
   - `face-upload`
   - `access-register-face`
   - `access-delete-face`
   - `get-home-data`
   - `get-user-account`
3. 在云数据库中创建以下集合：
   - `wx_user`
   - `access_profile`
   - `access_device`
   - `access_command`
   - `access_event_log`
   - `home_swiper`
   - `home_store`
   - `user_account`
   - `user_card`

## wx-login 配置

`wx-login/index.js` 默认使用：

```js
appid = 'wx75ea31b8c4707d16'
```

`AppSecret` 不要放到小程序前端。推荐在云函数环境变量中配置：

```text
WX_MINIAPP_APPID=wx75ea31b8c4707d16
WX_MINIAPP_SECRET=你的小程序AppSecret
```

如果你的 uniCloud 控制台不方便配置环境变量，也可以只在 `wx-login/index.js` 里把：

```js
const WECHAT_SECRET = process.env.WX_MINIAPP_SECRET || '请在这里填写你的小程序AppSecret';
```

替换成你的真实 AppSecret。

## 调用示例

### 1. 微信登录

```js
const loginRes = await uni.login({ provider: 'weixin' });
const res = await uniCloud.callFunction({
  name: 'wx-login',
  data: {
    code: loginRes.code,
    userInfo: {
      nickName: '微信用户',
      avatarUrl: ''
    }
  }
});
```

返回中的 `data.userId` 后续用于绑定人脸资料。

### 2. 保存人脸资料

```js
const res = await uniCloud.callFunction({
  name: 'face-upload',
  data: {
    userId,
    openid,
    fileID,
    userName: '张三',
    phone: '13800000000'
  }
});
```

`fileID` 来自 `uniCloud.uploadFile()`。如果你已经有 JPG Base64，也可以传 `picBase64`。

### 3. 创建注册人脸命令

```js
const res = await uniCloud.callFunction({
  name: 'access-register-face',
  data: {
    userId,
    sn: '门禁设备序列号',
    validity: 0
  }
});
```

这个函数只会写入 `access_command`，命令类型是 `REGISTER_FACE`，真正下发到门禁设备需要常驻桥接服务读取并执行。

### 4. 创建删除人脸命令

```js
const res = await uniCloud.callFunction({
  name: 'access-delete-face',
  data: {
    userId,
    sn: '门禁设备序列号'
  }
});
```

订单结束、取消、过期时调用它，生成 `DELETE_FACE` 命令。

## access_device 示例

需要先在 `access_device` 集合里放入设备信息，或调用注册/删除函数时直接传 `sn`。

```json
{
  "sn": "43434D340088078014190A02",
  "name": "门店大门",
  "roomId": "1",
  "status": "enabled",
  "createTime": 1780000000000
}
```

## 重要说明

云函数不能长期保持 WebSocket/MQTT 连接。门禁设备的 WebSocket/MQTT 桥接服务需要部署在 ECS、云托管或本地常驻电脑上，由它读取 `access_command` 并向门禁下发 `F1:redactUser`、`F1:deleteUser` 等命令。
