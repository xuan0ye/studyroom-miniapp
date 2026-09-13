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

function createJobNumber(seed) {
  const text = String(seed || Date.now());
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 90000000) + 100000;
}

exports.main = async (event, context) => {
  try {
    const {
      userId = '',
      openid = '',
      fileID = '',
      picBase64 = '',
      userName = '',
      phone = '',
      remark = ''
    } = event || {};

    if (!userId && !openid) {
      return fail('缺少 userId 或 openid', 400);
    }
    if (!fileID && !picBase64) {
      return fail('请先上传人脸照片 fileID，或传入 picBase64', 400);
    }

    const now = Date.now();
    const profiles = db.collection('access_profile');
    const query = userId ? { userId } : { openid };
    const existed = await profiles.where(query).limit(1).get();
    const cleanPicBase64 = normalizeBase64(picBase64);
    const jobnumber = createJobNumber(userId || openid);

    const profile = {
      userId,
      openid,
      userName,
      phone,
      fileID,
      picBase64: cleanPicBase64,
      jobnumber,
      faceStatus: 'pending',
      registerStatus: 'none',
      deleteStatus: 'none',
      remark,
      updateTime: now
    };

    let profileId = '';
    if (existed.data && existed.data.length) {
      profileId = existed.data[0]._id;
      await profiles.doc(profileId).update(profile);
    } else {
      const addRes = await profiles.add({
        ...profile,
        createTime: now
      });
      profileId = addRes.id;
    }

    return ok({
      profileId,
      jobnumber,
      hasBase64: Boolean(cleanPicBase64),
      fileID
    }, '人脸资料已保存');
  } catch (error) {
    console.error('face-upload failed:', error);
    return fail(error.message || '保存人脸资料失败', 500);
  }
};
