'use strict';

const db = uniCloud.database();

function ok(data = {}, msg = 'ok') {
  return { code: 0, msg, data };
}

function fail(msg = '操作失败', code = -1, data = {}) {
  return { code, msg, data };
}

function normalizeBase64(value = '') {
  return String(value).replace(/^data:image\/\w+;base64,/, '').trim();
}

function createToken(prefix = 'access') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function getProfile(event) {
  const profiles = db.collection('access_profile');
  if (event.profileId) {
    const res = await profiles.doc(event.profileId).get();
    return res.data && res.data[0];
  }

  const query = event.userId ? { userId: event.userId } : { openid: event.openid };
  const res = await profiles.where(query).orderBy('updateTime', 'desc').limit(1).get();
  return res.data && res.data[0];
}

async function getDeviceSn(event) {
  if (event.sn || event.deviceSn) {
    return event.sn || event.deviceSn;
  }

  if (!event.deviceId) {
    return '';
  }

  const res = await db.collection('access_device').doc(event.deviceId).get();
  const device = res.data && res.data[0];
  return device ? device.sn : '';
}

async function fileToBase64(fileID) {
  if (!fileID) {
    return '';
  }

  const tempRes = await uniCloud.getTempFileURL({ fileList: [fileID] });
  const info = tempRes.fileList && tempRes.fileList[0];
  if (!info || !info.tempFileURL) {
    throw new Error('获取人脸照片临时地址失败');
  }

  const fileRes = await uniCloud.httpclient.request(info.tempFileURL, {
    method: 'GET',
    dataType: 'arraybuffer',
    timeout: 15000
  });

  return Buffer.from(fileRes.data).toString('base64');
}

exports.main = async (event, context) => {
  try {
    const {
      userId = '',
      openid = '',
      userName = '',
      phone = '',
      validity = 0,
      recordPic = 0
    } = event || {};

    if (!userId && !openid && !event.profileId) {
      return fail('缺少 userId、openid 或 profileId', 400);
    }

    const sn = await getDeviceSn(event || {});
    if (!sn) {
      return fail('缺少门禁设备 sn，请传入 sn/deviceSn 或 deviceId', 400);
    }

    const profile = await getProfile(event || {});
    if (!profile) {
      return fail('未找到用户人脸资料，请先调用 face-upload', 404);
    }

    let pic = normalizeBase64(event.picBase64 || profile.picBase64 || '');
    if (!pic && profile.fileID) {
      pic = await fileToBase64(profile.fileID);
    }
    if (!pic) {
      return fail('人脸照片为空，请重新上传照片', 400);
    }

    const now = Date.now();
    const nowSeconds = Math.floor(now / 1000);
    const token = createToken('register_face');
    const body = {
      jobnumber: Number(event.jobnumber || profile.jobnumber),
      sTime: Number(profile.sTime || nowSeconds),
      eTime: nowSeconds,
      userName: userName || profile.userName || '微信用户',
      age: Number(event.age || profile.age || 0),
      sex: Number(event.sex || profile.sex || 0),
      nation: event.nation || profile.nation || '',
      identityCard: event.identityCard || profile.identityCard || '',
      phone: phone || profile.phone || '',
      dept: event.dept || profile.dept || '',
      card: event.card || profile.card || '',
      userPassword: event.userPassword || profile.userPassword || '',
      userType: Number(event.userType || profile.userType || 0),
      fingerprint: event.fingerprint || profile.fingerprint || '',
      recordPic: Number(recordPic),
      pic,
      validity: Number(validity || profile.validity || 0)
    };

    if (!body.jobnumber) {
      return fail('缺少门禁人员工号 jobnumber', 400);
    }

    const commandPayload = {
      cmd: 'F1:redactUser',
      token,
      sn,
      body
    };

    const addRes = await db.collection('access_command').add({
      type: 'REGISTER_FACE',
      cmd: 'F1:redactUser',
      token,
      sn,
      userId: userId || profile.userId || '',
      openid: openid || profile.openid || '',
      profileId: profile._id,
      jobnumber: body.jobnumber,
      status: 'pending',
      payload: commandPayload,
      retryCount: 0,
      result: null,
      createTime: now,
      updateTime: now
    });

    await db.collection('access_profile').doc(profile._id).update({
      registerStatus: 'pending',
      lastRegisterCommandId: addRes.id,
      updateTime: now
    });

    return ok({
      commandId: addRes.id,
      token,
      sn,
      jobnumber: body.jobnumber
    }, '注册人脸命令已创建');
  } catch (error) {
    console.error('access-register-face failed:', error);
    return fail(error.message || '创建注册人脸命令失败', 500);
  }
};
