export function hasPromoPrice(value) {
  return value !== null && value !== undefined && String(value).trim() !== '' && isFinite(Number(value))
}

export function formatPromoPrice(value) {
  if (!hasPromoPrice(value)) return ''
  const price = Number(value)
  return price % 1 === 0 ? String(price) : price.toFixed(2)
}

export function formatPromoUnit(value, price) {
  let unit = String(value || '').trim().replace(/／/g, '/')
  // 后台存有“2 元/人”“元/人”等写法，金额与人民币单位只展示一次。
  const amount = unit.match(/^[¥￥]?\s*(\d+(?:\.\d+)?)\s*元?\s*(?=\/)/)
  if (amount && hasPromoPrice(price) && Number(amount[1]) === Number(price)) unit = unit.slice(amount[0].length)
  unit = unit.replace(/^元\s*(?=\/|$)/, '').trim()
  if (/^(人|次|天|小时|月|年|张|份|周)$/.test(unit)) return '/' + unit
  return unit
}
