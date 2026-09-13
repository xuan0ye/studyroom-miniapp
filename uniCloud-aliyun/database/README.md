# StudyRoom uniCloud 数据库配置说明

本目录下的 `*.schema.json` 对应 uniCloud 云数据库集合结构。上传后，云平台里的“表结构/权限/索引”会按这些文件生成。

## 集合用途

| 集合 | 用途 |
| --- | --- |
| `wx_user` | 保存微信登录用户、openid、头像、手机号等 |
| `access_profile` | 保存用户人脸资料、云存储 fileID、门禁工号 |
| `access_device` | 保存门禁设备 SN、门店/房间绑定、协议类型 |
| `access_command` | 保存待下发门禁命令，桥接服务从这里读取 |
| `access_event_log` | 保存门禁开门记录、陌生人记录、命令结果 |

## 权限怎么填

这 5 个集合的权限都设置为：

```json
{
  "read": false,
  "create": false,
  "update": false,
  "delete": false
}
```

意思是：小程序前端不能直接读写数据库，只能通过云函数操作。这样更安全，避免用户伪造请求直接改人脸和门禁命令。

## 索引怎么填

索引已经写在各自的 `.schema.json` 里，上传 schema 后会自动创建或提示创建。重点索引如下：

- `wx_user.openid`：唯一索引，避免同一个微信用户重复创建。
- `access_device.sn`：唯一索引，避免同一台门禁重复录入。
- `access_command.status + createTime`：桥接服务按状态读取待执行命令时使用。
- `access_command.token`：唯一索引，用于匹配设备回包。
- `access_event_log.sn + eventTime`：按设备查询开门记录时使用。

## 表结构怎么填

不用在控制台手填字段。直接在 HBuilderX 里右键 `database` 或每个 `.schema.json` 上传数据库 Schema。

上传后，如果控制台显示字段、权限、索引，就说明表结构已经生效。

## Schema 扩展怎么填

当前阶段不用填 Schema 扩展。Schema 扩展通常用于 uni-admin 表单展示、字段联动、前端校验等管理后台增强能力。你现在这些集合主要由云函数和后续门禁桥接服务使用，所以先留空即可。

## 必须手动添加的初始数据

至少要在 `access_device` 里添加一条门禁设备数据。把 `sn` 换成你的门禁设备真实序列号：

```json
{
  "sn": "43434D340088078014190A02",
  "name": "门店大门",
  "storeId": "1",
  "roomId": "1",
  "ipaddress": "192.168.1.66",
  "protocol": "websocket",
  "status": "enabled",
  "lastHeartbeatTime": 0,
  "remark": "示例设备，请替换为真实门禁 SN",
  "createTime": 1780000000000,
  "updateTime": 1780000000000
}
```

`wx_user`、`access_profile`、`access_command`、`access_event_log` 不需要手动加数据：

- `wx_user`：用户调用 `wx-login` 后自动生成。
- `access_profile`：用户上传人脸后由 `face-upload` 自动生成。
- `access_command`：预约/注册人脸/删除人脸时自动生成。
- `access_event_log`：门禁桥接服务收到设备记录后生成。
