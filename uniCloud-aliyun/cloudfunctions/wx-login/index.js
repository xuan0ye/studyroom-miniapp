'use strict';

const db = uniCloud.database();

// 上传前请确认 AppSecret 正确。不要把 AppSecret 放到小程序前端。
const WECHAT_APPID = process.env.WX_MINIAPP_APPID || 'wx75ea31b8c4707d16';
const WECHAT_SECRET = process.env.WX_MINIAPP_SECRET || 'be478adff1806e332db6ecb01631d5c3';

function ok(data = {}, msg = 'ok') {
  return { code: 0, msg, data };
}

function fail(msg = '操作失败', code = -1, data = {}) {
  return { code, msg, data };
}

async function code2Session(code) {
  if (!WECHAT_SECRET || WECHAT_SECRET.includes('请在这里填写')) {
    throw new Error('请先在 wx-login 云函数中填写 WECHAT_SECRET');
  }

  const url = 'https://api.weixin.qq.com/sns/jscode2session';
  const res = await uniCloud.httpclient.request(url, {
    method: 'GET',
    dataType: 'json',
    data: {
      appid: WECHAT_APPID,
      secret: WECHAT_SECRET,
      js_code: code,
      grant_type: 'authorization_code'
    }
  });

  const body = res.data || {};
  if (body.errcode) {
    throw new Error(`微信登录失败：${body.errmsg || body.errcode}`);
  }
  if (!body.openid) {
    throw new Error('微信登录失败：未返回 openid');
  }

  return body;
}

exports.main = async (event, context) => {
  try {
    const { code, userInfo = {}, phone = '' } = event || {};
    if (!code) {
      return fail('缺少微信登录 code', 400);
    }

    const session = await code2Session(code);
    const now = Date.now();
    const users = db.collection('wx_user');
    const existed = await users.where({ openid: session.openid }).limit(1).get();

    const userRecord = {
      openid: session.openid,
      unionid: session.unionid || '',
      sessionKey: session.session_key || '',
      nickName: userInfo.nickName || userInfo.nickname || '',
      avatarUrl: userInfo.avatarUrl || userInfo.avatar || '',
      gender: userInfo.gender || 0,
      phone,
      lastLoginTime: now,
      updateTime: now
    };

    let userId = '';
    let isNew = false;
    if (existed.data && existed.data.length) {
      userId = existed.data[0]._id;
      await users.doc(userId).update(userRecord);
    } else {
      isNew = true;
      const addRes = await users.add({
        ...userRecord,
        createTime: now,
        status: 'enabled'
      });
      userId = addRes.id;
    }

    return ok({
      userId,
      openid: session.openid,
      unionid: session.unionid || '',
      isNew
    }, '登录成功');
  } catch (error) {
    console.error('wx-login failed:', error);
    return fail(error.message || '微信登录失败', 500);
  }
};
