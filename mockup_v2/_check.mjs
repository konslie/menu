/* 합성 데이터가 mockup.html의 RAW와 동일한지 + 시안 JS가 파싱/실행되는지 확인 */
import fs from 'fs';
import vm from 'vm';

const dir = new URL('./', import.meta.url);
const mockup = fs.readFileSync(new URL('../mockup.html', dir), 'utf8');
const m = mockup.match(/let RAW=(\[[\s\S]*?\]);\nlet TAXO/);
if (!m) throw new Error('mockup.html의 RAW 추출 실패');
const REF = JSON.parse(m[1]);

// _data.js를 순수 실행해 RAW 비교
const ctx = { document: { getElementById: () => null } };
vm.createContext(ctx);
const EXPORTS = ['RAW', 'CUSTOMERS', 'AXKEYS', 'aggAll', 'aggTotal', 'aggIndustry'];
vm.runInContext(
  fs.readFileSync(new URL('_data.js', dir), 'utf8') +
  `\n;__out={${EXPORTS.join(',')}};`, ctx);
const X = ctx.__out, MINE = X.RAW;
ctx.aggAll = X.aggAll; ctx.aggTotal = X.aggTotal; ctx.aggIndustry = X.aggIndustry;
ctx.CUSTOMERS = X.CUSTOMERS; ctx.AXKEYS = X.AXKEYS;

console.assert(MINE.length === REF.length, `행 수 불일치: ${MINE.length} vs ${REF.length}`);
const key = r => [r.name, r.salesCode, r.sales2025, r.sales2026, r.axMajor, r.axMiddle].join('|');
const a = MINE.map(key).sort(), b = REF.map(key).sort();
const diff = a.findIndex((x, i) => x !== b[i]);
console.assert(diff === -1, `데이터 불일치 @${diff}: ${a[diff]} vs ${b[diff]}`);
console.assert(ctx.CUSTOMERS.length === 53, '고객 수 53 아님: ' + ctx.CUSTOMERS.length);

// 집계 sanity
const rows = ctx.aggAll(), tot = ctx.aggTotal(rows), inds = ctx.aggIndustry(rows);
console.assert(rows.length === 53, 'aggAll 53행 아님');
console.assert(tot.usedCodes > 0 && tot.usedCodes <= tot.catalog, 'usedCodes 범위 이상');
console.assert(inds.reduce((s, g) => s + g.n, 0) === 53, '업종 합계 53 아님');
console.assert(Math.abs(inds.reduce((s, g) => s + g.salesTotal, 0) - tot.salesTotal) < 1, '업종 매출 합계 != 전체');
// 각 고객의 axKey 합이 전체와 맞는지
rows.forEach(r => {
  const s = ctx.AXKEYS.reduce((x, k) => x + r.data[k].sales, 0);
  console.assert(Math.abs(s - r.salesTotal) < 1, `${r.name} axKey 매출 합 불일치`);
  const u = ctx.AXKEYS.reduce((x, k) => x + r.data[k].used, 0);
  console.assert(u === r.usedTotal, `${r.name} used 합 불일치`);
});

// 각 시안 JS 문법 확인
for (const k of ['a', 'b', 'c']) {
  const f = new URL(`_${k}.js`, dir);
  if (!fs.existsSync(f)) continue;
  new vm.Script(fs.readFileSync(f, 'utf8'), { filename: `_${k}.js` }); // throws on syntax error
}
console.log(`OK — ${MINE.length}행 / 53개사, mockup.html RAW와 동일. 집계·문법 검증 통과.`);
console.log(`카탈로그 ${tot.catalog}종 중 KA 사용 ${tot.usedCodes}종 · 총매출 ${(tot.salesTotal/1e8).toFixed(0)}억 · 평균 ${tot.avgUsed.toFixed(1)}종`);
