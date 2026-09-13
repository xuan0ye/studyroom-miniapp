'use strict';

const db = uniCloud.database();

function ok(data = {}, msg = 'ok') {
  return { code: 0, msg, data };
}

function fail(msg = '操作失败', code = -1, data = {}) {
  return { code, msg, data };
}

function createToken(prefix = 'access') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function getProfile(event) {
  if (event.profileId) {
    const res = await db.collection('access_profile').doc(event.profileId).get();
    return res.data && res.data[0];
  }

  if (!event.userId && !event.openid) {
    return null;
  }

  const query = event.userId ? { userId: event.userId } : { openid: event.openid };
  const res = await db.collection('access_profile').where(query).orderBy('updateTime', 'desc').limit(1).get();
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

exports.main = async (event, context) => {
  try {
    const input = event || {};
    const sn = await getDeviceSn(input);
    if (!sn) {
      return fail('缺少门禁设备 sn，请传入 sn/deviceSn 或 deviceId', 400);
    }

    const profile = await getProfile(input);
    const jobnumber = Number(input.jobnumber || (profile && profile.jobnumber));
    if (!jobnumber) {
      return fail('缺少门禁人员工号 jobnumber，或未找到人脸资料', 400);
    }

    const now = Date.now();
    const token = createToken('delete_face');
    const jobnumberArray = Array.isArray(input.jobnumberArray)
      ? input.jobnumberArray.map(Number).filter(Boolean)
      : [jobnumber];

    const commandPayload = {
      cmd: 'F1:deleteUser',
      token,
      sn,
      jobnumberArray
    };

    const addRes = await db.collection('access_command').add({
      type: 'DELETE_FACE',
      cmd: 'F1:deleteUser',
      token,
      sn,
      userId: input.userId || (profile && profile.userId) || '',
      openid: input.openid || (profile && profile.openid) || '',
      profileId: profile ? profile._id : '',
      jobnumber,
      status: 'pending',
      payload: commandPayload,
      retryCount: 0,
      result: null,
      createTime: now,
      updateTime: now
    });

    if (profile && profile._id) {
      await db.collection('access_profile').doc(profile._id).update({
        deleteStatus: 'pending',
        lastDeleteCommandId: addRes.id,
        updateTime: now
      });
    }

    return ok({
      commandId: addRes.id,
      token,
      sn,
      jobnumberArray
    }, '删除人脸命令已创建');
  } catch (error) {
    console.error('access-delete-face failed:', error);
    return fail(error.message || '创建删除人脸命令失败', 500);
  }
};
