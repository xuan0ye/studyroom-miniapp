// Run after building mp-weixin: node tests/verify-wechat-components.cjs [output-directory]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../unpackage/dist/build/mp-weixin');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const components = ['components/book-loading/book-loading', 'other_pages/check-seat/components/seat-occupant'];

for (const component of components) {
  const script = read(component + '.js');
  assert.ok(!/^\s*Component\(\{\}\)\s*;?\s*$/.test(script), component + ': empty native registration cannot receive Vue data');
  assert.ok(script.includes('createComponent'), component + ': native Vue component registration is missing');
  assert.equal(JSON.parse(read(component + '.json')).component, true);
  assert.ok(read(component + '.wxml').length > 0);
  console.log('Native component registered: ' + component);
}

const bookStyles = read('components/book-loading/book-loading.wxss');
assert.ok(bookStyles.includes('@keyframes') && bookStyles.includes('rotateY'), 'Book animation styles are missing');
assert.ok(read('components/book-loading/book-loading.wxml').includes('visible'), 'Book visibility binding is missing');

for (const page of ['pages/index/index', 'other_pages/check-seat/check-seat', 'other_pages/seat-status/seat-status']) {
  const config = JSON.parse(read(page + '.json'));
  assert.equal(config.usingComponents['book-loading'], '/components/book-loading/book-loading', page + ': wrong loading component path');
  console.log('Loading component linked: ' + page);
}
console.log('WeChat component registration and animation checks passed.');
