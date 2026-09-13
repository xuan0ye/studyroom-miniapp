'use strict';

const db = uniCloud.database();

const DEFAULT_SWIPER = [
  {
    _id: 'default-swiper-1',
    url: '/static/index/vipCard.png',
    title: '自习室预约'
  }
];

const DEFAULT_STORE_ROWS = [
  {
    _id: 'default-store-1',
    roomId: '1',
    roomName: '默认自习室',
    roomAddr: '请在云数据库 home_store 集合中配置门店地址',
    openTime: '08:00',
    closeTime: '23:00',
    status: 'enabled'
  }
];

function ok(data = {}, msg = 'ok') {
  return { code: 0, msg, data };
}

async function safeGet(collectionName, fallback, options = {}) {
  try {
    let query = db.collection(collectionName).where({ status: 'enabled' });
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.order || 'asc');
    }
    const res = await query.get();
    return res.data && res.data.length ? res.data : fallback;
  } catch (error) {
    console.warn(`${collectionName} fallback:`, error.message || error);
    return fallback;
  }
}

exports.main = async (event, context) => {
  const type = event && event.type;
  const swiper = await safeGet('home_swiper', DEFAULT_SWIPER, {
    orderBy: 'sort',
    order: 'asc'
  });
  const rows = await safeGet('home_store', DEFAULT_STORE_ROWS, {
    orderBy: 'sort',
    order: 'asc'
  });

  if (type === 'swiper') {
    return ok(swiper);
  }
  if (type === 'store') {
    return ok({ rows, total: rows.length });
  }

  return ok({
    swiper,
    store: {
      rows,
      total: rows.length
    }
  });
};
