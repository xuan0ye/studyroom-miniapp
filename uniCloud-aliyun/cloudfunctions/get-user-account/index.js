'use strict';

const db = uniCloud.database();

function ok(data = {}, msg = 'ok') {
  return { code: 0, msg, data };
}

function getIdentity(event = {}) {
  return {
    userId: event.userId || event.cloudUserId || '',
    openid: event.openid || ''
  };
}

async function getBalance(identity) {
  try {
    const query = identity.userId ? { userId: identity.userId } : { openid: identity.openid };
    if (!query.userId && !query.openid) {
      return { balance: 0 };
    }
    const res = await db.collection('user_account').where(query).limit(1).get();
    if (res.data && res.data.length) {
      return {
        balance: Number(res.data[0].balance || 0),
        accountId: res.data[0]._id
      };
    }
  } catch (error) {
    console.warn('user_account fallback:', error.message || error);
  }
  return { balance: 0 };
}

async function getCard(identity) {
  try {
    const query = identity.userId ? { userId: identity.userId } : { openid: identity.openid };
    if (!query.userId && !query.openid) {
      return { rows: [], total: 0 };
    }
    const res = await db.collection('user_card').where(query).orderBy('createTime', 'desc').get();
    const rows = res.data || [];
    return { rows, total: rows.length };
  } catch (error) {
    console.warn('user_card fallback:', error.message || error);
    return { rows: [], total: 0 };
  }
}

exports.main = async (event, context) => {
  const type = event && event.type;
  const identity = getIdentity(event);

  if (type === 'balance') {
    return ok(await getBalance(identity));
  }
  if (type === 'card') {
    return ok(await getCard(identity));
  }

  const balance = await getBalance(identity);
  const card = await getCard(identity);
  return ok({ balance, card });
};
