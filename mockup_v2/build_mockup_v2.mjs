import fs from 'node:fs/promises';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const KA_PRODUCT_TOTAL = 63;
const templatePath = path.join(dir, 'mockup_v2.template.html');
const outputPath = path.join(dir, 'mockup_v2.html');
const vdiOutputPath = path.join(dir, 'mockup_v2-vdi.html');
const salesPath = path.join(dir, '..', '더미데이터_매출.csv');
const walletPath = path.join(dir, '..', '더미데이터_월렛쉐어.csv');

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const headers = rows.shift().map((x) => x.trim());
  return rows.filter((r) => r.some((x) => x !== '')).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

const toNum = (value) => {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
};

const [salesText, walletText, template] = await Promise.all([
  fs.readFile(salesPath, 'utf8'),
  fs.readFile(walletPath, 'utf8'),
  fs.readFile(templatePath, 'utf8'),
]);

const salesRows = parseCsv(salesText).map((row) => {
  const code = row['매출코드'];
  return { ...row, '매출명': code === 'M31' ? 'M2M차량' : row['매출명'] };
});
const walletRows = parseCsv(walletText);

const customers = [];
const customerSeen = new Set();
for (const row of salesRows) {
  if (customerSeen.has(row['고객ID'])) continue;
  customerSeen.add(row['고객ID']);
  customers.push({
    idx: customers.length + 1,
    id: row['고객ID'],
    name: row['고객명'],
    tier: row['Tier'],
    industry: row['업종'],
  });
}

const products = [];
const productSeen = new Set();
for (const row of salesRows) {
  const key = `${row['매출코드']}|||${row['매출명']}`;
  if (productSeen.has(key)) continue;
  productSeen.add(key);
  products.push({
    s: key,
    code: row['매출코드'],
    name: row['매출명'],
    custComm: row['고객소통명'] ?? '',
    major: row['대분류'] ?? '',
    middle: row['중분류'] ?? '',
    aiStack: row['AI Stack'] ?? '',
    axM: row['AX구분_대'],
    axm: row['AX구분_중'],
  });
}

const raw = salesRows.map((row) => ({
  custId: row['고객ID'],
  name: row['고객명'],
  tier: row['Tier'],
  industry: row['업종'],
  salesCode: `${row['매출코드']}|||${row['매출명']}`,
  salesDisplayCode: row['매출코드'],
  salesName: row['매출명'],
  custComm: row['고객소통명'] ?? '',
  major: row['대분류'] ?? '',
  middle: row['중분류'] ?? '',
  aiStack: row['AI Stack'] ?? '',
  sales2025: toNum(row['25년매출']),
  sales2026: toNum(row['26년매출']),
  axMajor: row['AX구분_대'],
  axMiddle: row['AX구분_중'],
}));

const walletGroups = {};
for (const row of walletRows) {
  if (row.WLSR_YN !== 'Y') continue;
  const name = row.EPM_GRP_KORN_NM;
  const upls = toNum(row.UPLS), kt = toNum(row.KT), sk = toNum(row.SK), etc = toNum(row.ETC);
  const total = upls + kt + sk + etc;
  if (!walletGroups[name]) walletGroups[name] = { name, upls: 0, kt: 0, sk: 0, etc: 0, total: 0, valid: false, share: null };
  walletGroups[name].upls += upls;
  walletGroups[name].kt += kt;
  walletGroups[name].sk += sk;
  walletGroups[name].etc += etc;
  walletGroups[name].total += total;
  walletGroups[name].valid = walletGroups[name].total > 0;
  walletGroups[name].share = walletGroups[name].valid ? walletGroups[name].upls / walletGroups[name].total : null;
}

const wallets = {};
for (const customer of customers) {
  const wallet = walletGroups[customer.name];
  if (wallet) wallets[customer.id] = { ...wallet, id: customer.id };
}

if (customers.length !== 53) throw new Error(`Expected 53 customers, found ${customers.length}`);
if (products.length !== 62) throw new Error(`Expected 62 observed products after M31 normalization, found ${products.length}`);
const matchedWalletCount = customers.filter((c) => wallets[c.id]?.valid).length;
if (matchedWalletCount !== 52) throw new Error(`Expected 52 wallet-valid customers matched to sales, found ${matchedWalletCount}`);

const industryOrder = ['금융', '대기업', '온라인/IT', '글로벌', '공공', 'SME'].filter((name) => customers.some((c) => c.industry === name));
const dataBlock = `/* 실제 더미 CSV를 빌드 시 내장한다. M31은 M2M차량으로 통합한다. */
const FULL_CATALOG_TOTAL=132;
const KA_PRODUCT_TOTAL=63;
const CATALOG_TOTAL=KA_PRODUCT_TOTAL;
let CATALOG=${JSON.stringify(products)};
const sName=c=>c.name;
const INDUSTRY_ORDER=${JSON.stringify(industryOrder)};
let CUSTOMERS=${JSON.stringify(customers)};
let RAW=${JSON.stringify(raw)};
let WALLETS=${JSON.stringify(wallets)};
`;

const start = template.indexOf('/* 공용 합성 데이터');
const end = template.indexOf('/* ── 공용 유틸 ── */', start);
if (start < 0 || end < 0) throw new Error('Could not find the synthetic data block in the template');
const output = `${template.slice(0, start)}${dataBlock}\n${template.slice(end)}`;
await fs.writeFile(outputPath, output, 'utf8');

// VDI 배포본은 동일한 UI와 CSV 업로드 기능을 사용하되, 초기에는 데이터 없이 시작한다.
const vdiDataBlock = `/* VDI 배포본: 사용자가 CSV를 업로드하면 브라우저에서 데이터를 계산한다. */
const FULL_CATALOG_TOTAL=132;
const KA_PRODUCT_TOTAL=63;
const CATALOG_TOTAL=KA_PRODUCT_TOTAL;
let CATALOG=[];
const sName=c=>c.name;
const INDUSTRY_ORDER=[];
let CUSTOMERS=[];
let RAW=[];
let WALLETS={};
`;
const vdiOutput = `${template.slice(0, start)}${vdiDataBlock}\n${template.slice(end)}`;
await fs.writeFile(vdiOutputPath, vdiOutput, 'utf8');

console.log(`Built ${outputPath} and ${vdiOutputPath}: ${customers.length} customers, ${products.length} observed products (KA denominator ${KA_PRODUCT_TOTAL}), ${matchedWalletCount} wallet-valid customers matched to sales.`);
