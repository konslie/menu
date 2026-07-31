import fs from 'fs';

// ── 보존 조각(현재 정상 mockup.html에서 추출한 것) ──
const baseCss = fs.readFileSync('.base_css.txt', 'utf8');
const tabxCss = fs.readFileSync('.tabx.css', 'utf8');
const survivingJs = fs.readFileSync('.surv.txt', 'utf8');
const TAB_B_HTML = fs.readFileSync('.tabB.html', 'utf8');
const TAB_B_JS = fs.readFileSync('.tabB.js', 'utf8');

// ── 합성 데이터(53개사) 결정론적 생성 ──
// AX 구분: 대분류 AX/Legacy, 중분류는 각 하위에 Infra/Application 두 개만. 그 아래 상품군.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32; };
// 대분류(major)는 AX 구분과 별개인 손익 계층. 카테고리마다 대분류 2개씩(실데이터처럼 카테고리>대분류>세부상품 3단 구조).
const CATALOG = [
  // NW Infra → Legacy/Infra · 대분류1~2
  { s: 'S01', ai: 'NW Infra', axM: 'Legacy', axm: 'Infra', pg: 'P01', mj: '대분류1', pop: 0.92, scale: 2.2e9 },
  { s: 'S02', ai: 'NW Infra', axM: 'Legacy', axm: 'Infra', pg: 'P02', mj: '대분류1', pop: 0.85, scale: 1.4e9 },
  { s: 'S03', ai: 'NW Infra', axM: 'Legacy', axm: 'Infra', pg: 'P03', mj: '대분류1', pop: 0.7, scale: 8e8 },
  { s: 'S04', ai: 'NW Infra', axM: 'Legacy', axm: 'Infra', pg: 'P04', mj: '대분류2', pop: 0.55, scale: 6e8 },
  { s: 'S05', ai: 'NW Infra', axM: 'Legacy', axm: 'Infra', pg: 'P05', mj: '대분류2', pop: 0.38, scale: 3e8 },
  { s: 'S06', ai: 'NW Infra', axM: 'Legacy', axm: 'Infra', pg: 'P06', mj: '대분류2', pop: 0.28, scale: 2e8 },
  // AI Infra → AX/Infra · 대분류3~4
  { s: 'S07', ai: 'AI Infra', axM: 'AX', axm: 'Infra', pg: 'P07', mj: '대분류3', pop: 0.72, scale: 3.5e9 },
  { s: 'S08', ai: 'AI Infra', axM: 'AX', axm: 'Infra', pg: 'P08', mj: '대분류3', pop: 0.5, scale: 1.8e9 },
  { s: 'S09', ai: 'AI Infra', axM: 'AX', axm: 'Infra', pg: 'P09', mj: '대분류4', pop: 0.33, scale: 9e8 },
  { s: 'S10', ai: 'AI Infra', axM: 'AX', axm: 'Infra', pg: 'P10', mj: '대분류4', pop: 0.22, scale: 1.2e9 },
  { s: 'S11', ai: 'AI Infra', axM: 'AX', axm: 'Infra', pg: 'P11', mj: '대분류4', pop: 0.15, scale: 7e8 },
  // AI Platform → AX/Infra · 대분류5~6
  { s: 'S12', ai: 'AI Platform', axM: 'AX', axm: 'Infra', pg: 'P12', mj: '대분류5', pop: 0.58, scale: 1.1e9 },
  { s: 'S13', ai: 'AI Platform', axM: 'AX', axm: 'Infra', pg: 'P13', mj: '대분류5', pop: 0.4, scale: 6e8 },
  { s: 'S14', ai: 'AI Platform', axM: 'AX', axm: 'Infra', pg: 'P14', mj: '대분류6', pop: 0.3, scale: 5e8 },
  { s: 'S15', ai: 'AI Platform', axM: 'AX', axm: 'Infra', pg: 'P15', mj: '대분류6', pop: 0.18, scale: 4e8 },
  { s: 'S16', ai: 'AI Platform', axM: 'AX', axm: 'Infra', pg: 'P16', mj: '대분류6', pop: 0.12, scale: 3e8 },
  // AI Model → AX/Application(모델 서빙=응용 계층) · 대분류7~8
  { s: 'S17', ai: 'AI Model', axM: 'AX', axm: 'Application', pg: 'P17', mj: '대분류7', pop: 0.42, scale: 1.6e9 },
  { s: 'S18', ai: 'AI Model', axM: 'AX', axm: 'Application', pg: 'P18', mj: '대분류7', pop: 0.26, scale: 9e8 },
  { s: 'S19', ai: 'AI Model', axM: 'AX', axm: 'Application', pg: 'P19', mj: '대분류8', pop: 0.16, scale: 7e8 },
  { s: 'S20', ai: 'AI Model', axM: 'AX', axm: 'Application', pg: 'P20', mj: '대분류8', pop: 0.1, scale: 1.4e9 },
  { s: 'S21', ai: 'AI Model', axM: 'AX', axm: 'Application', pg: 'P21', mj: '대분류8', pop: 0.08, scale: 1.1e9 },
  // Application → Legacy/Application, AX/Application 혼합 · 대분류9~10
  { s: 'S22', ai: 'Application', axM: 'Legacy', axm: 'Application', pg: 'P22', mj: '대분류9', pop: 0.8, scale: 5e8 },
  { s: 'S23', ai: 'Application', axM: 'Legacy', axm: 'Application', pg: 'P23', mj: '대분류9', pop: 0.62, scale: 4e8 },
  { s: 'S24', ai: 'Application', axM: 'AX', axm: 'Application', pg: 'P24', mj: '대분류9', pop: 0.45, scale: 7e8 },
  { s: 'S25', ai: 'Application', axM: 'AX', axm: 'Application', pg: 'P25', mj: '대분류10', pop: 0.3, scale: 6e8 },
  { s: 'S26', ai: 'Application', axM: 'AX', axm: 'Application', pg: 'P26', mj: '대분류10', pop: 0.2, scale: 5e8 },
  { s: 'S27', ai: 'Application', axM: 'AX', axm: 'Application', pg: 'P27', mj: '대분류10', pop: 0.13, scale: 4e8 },
];
const sName = c => '세부상품' + c.s.slice(1);
const pName = c => '상품군' + c.pg.slice(1);

const INDUSTRIES = [{ name: '금융', n: 9 }, { name: '대기업', n: 9 }, { name: '온라인/IT', n: 9 }, { name: '글로벌', n: 9 }, { name: '공공', n: 9 }, { name: 'SME', n: 8 }];
const customers = [];
let idx = 0;
for (const ind of INDUSTRIES) for (let k = 0; k < ind.n; k++) {
  idx++;
  const r = rng(1000 + idx * 7);
  const tier = r() < 0.18 ? 'Tier1' : r() < 0.72 ? 'Tier2' : 'Tier3';
  const num = String(idx).padStart(2, '0');
  customers.push({
    idx, name: '고객' + num, tier, industry: ind.name,
    customerId: idx === 30 ? 'CID92CAE5FFBEAD7BFE' : 'CIDANON' + num + 'A' + (1000 + idx * 31).toString(16).toUpperCase(),
  });
}
// 시드 결과상 Tier1이 드물게 나오는 경우를 대비해 최소 5개사는 Tier1을 보장(결정론적)
const TIER1_MIN = 5;
{
  const tier1Count = customers.filter(c => c.tier === 'Tier1').length;
  if (tier1Count < TIER1_MIN) {
    const nonTier1 = customers.filter(c => c.tier !== 'Tier1');
    for (let i = 0; i < TIER1_MIN - tier1Count && i < nonTier1.length; i++) nonTier1[i].tier = 'Tier1';
  }
}
const sizeFactor = { Tier1: 3.0, Tier2: 1.4, Tier3: 0.6 };
const RAW = [];
for (const c of customers) {
  const r = rng(9000 + c.idx * 13), rows = [];
  const mkRow = (p) => ({
    customerId: c.customerId, name: c.name, tier: c.tier, industry: c.industry,
    profitCode: p.pg, profitName: pName(p), salesCode: p.s, salesName: sName(p),
    sales2025: 0, sales2026: 0,
    major: p.mj, middle: '중분류' + p.s.slice(1), axMajor: p.axM, axMiddle: p.axm,
  });
  for (const p of CATALOG) {
    let pop = p.pop;
    if (c.industry === '금융' && (p.ai === 'AI Platform' || p.ai === 'AI Model')) pop = Math.min(0.95, pop + 0.12);
    if (c.industry === '대기업' && p.ai === 'NW Infra') pop = Math.min(0.95, pop + 0.08);
    if (c.industry === '글로벌' && p.ai === 'Application') pop = Math.min(0.95, pop + 0.1);
    if (r() > pop) continue;
    const base = p.scale * sizeFactor[c.tier] * (0.5 + r() * 1.1), annual = Math.round(base);
    const born26 = r() < 0.06, churn = r() < 0.08;
    const s2025 = born26 ? 0 : Math.round(annual * (0.85 + r() * 0.35));
    const s2026 = churn ? 0 : Math.round(annual * (0.35 + r() * 0.22));
    if (!s2025 && !s2026) continue;
    const row = mkRow(p); row.sales2025 = s2025; row.sales2026 = s2026; rows.push(row);
  }
  if (rows.length < 4) for (const p of [...CATALOG].sort((a, b) => b.pop - a.pop)) {
    if (rows.find(x => x.salesCode === p.s)) continue;
    const base = p.scale * sizeFactor[c.tier], row = mkRow(p);
    row.sales2025 = Math.round(base); row.sales2026 = Math.round(base * 0.45); rows.push(row);
    if (rows.length >= 4) break;
  }
  RAW.push(...rows);
}
console.error(`생성: ${customers.length}개사, ${RAW.length}행`);

// ── 상품체계 데이터(TAXO) 결정론적 합성 ──
// 실제 문서 구조(AX구분(대)/AX구분(중)/대분류/소분류/손익명/고객소통명)를 따르되, 상품체계는 매출데이터(RAW)와
// 별도로 업로드·관리되는 참조 데이터라는 점을 보이기 위해 손익명 표기를 일부 의도적으로 살짝 다르게 한다
// (예: '상품군3' vs '상품군3 서비스') — 팝업의 "매출발생" 체크는 taxSimilar()로 유사 매칭한다.
const TAXO_DEMO = [];
CATALOG.forEach((p, i) => {
  TAXO_DEMO.push({
    axMajor: p.axM, axMiddle: p.axm, major: p.mj,
    middle: '소분류' + p.s.slice(1),
    profitName: i % 2 === 1 ? pName(p) + ' 서비스' : pName(p),
    salesName: sName(p),
  });
});
// 상품체계에는 등록됐지만 아직 매출이 없는 신규 상품(화이트스페이스 데모용)
['신규1', '신규2', '신규3'].forEach((tag, i) => {
  TAXO_DEMO.push({
    axMajor: i % 2 ? 'Legacy' : 'AX', axMiddle: i % 2 ? 'Application' : 'Infra',
    major: '대분류' + (11 + i), middle: '소분류' + tag,
    profitName: '상품군' + tag, salesName: '세부상품' + tag,
  });
});

// ── 조립 (RAW 데이터만 갈아끼워 데모용/배포용 두 산출물 생성) ──
function assemble(rawData, taxoData, statusLabel) {
  const PREAMBLE = `
let RAW=${JSON.stringify(rawData)};
let TAXO=${JSON.stringify(taxoData)};
let view='ax',mode='service',year='2026',page=1,pageSize=20,expanded=false,customers=[],industries=[],tiers=[],currentId=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CORP=/\\(주\\)|㈜|주식회사|\\(유\\)|\\(유한\\)|유한회사|\\(재\\)|재단법인|\\(사\\)|사단법인|\\(합\\)|합자회사|합명회사/g;
const cleanName=s=>String(s??'').replace(CORP,' ').replace(/\\s+/g,' ').trim();
const fmt=n=>(Number(n||0)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1});
const salesField=()=>year==='2026'?'sales2026':'sales2025';
const serviceKey=r=>r.salesCode;
const label=r=>r.salesName;
const axKey=r=>\`\${r.axMajor}|||\${r.axMiddle}\`;
const cat=r=>axKey(r);
const catLabel=c=>c&&c.includes('|||')?c.split('|||')[1]:c;
const INDUSTRY_ORDER=['금융','대기업','온라인/IT','글로벌','공공','SME'];
const industryRank=x=>{const i=INDUSTRY_ORDER.indexOf(x);return i<0?99:i;};
`;
  const tabBHtmlForBuild = TAB_B_HTML.replace('DEFAULT: 메뉴판데이터2.1.xlsx', statusLabel);
  const survForBuild = survivingJs.replace(
    /`DEFAULT: 메뉴판데이터2\.1\.xlsx · \$\{customers\.length\}개 고객`/,
    `\`${statusLabel} · \${customers.length}개 고객\``
  );
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enterprise 고객 상품 제안 메뉴판</title><style>
${baseCss}
${tabxCss}
</style></head><body>
<div id="tabB-wrap">
${tabBHtmlForBuild}
</div>
<script>
${PREAMBLE}
${survForBuild}
${TAB_B_JS}
</script>
</body>
</html>`;
}

// 1) 데모용(합성 53개사 포함) — 로컬 검토·시연용
const outDemo = assemble(RAW, TAXO_DEMO, 'DEFAULT: 메뉴판데이터2.1.csv');
fs.writeFileSync('mockup.html', outDemo);
console.error('mockup.html(데모용) 작성 완료:', outDemo.length, 'bytes');

// 2) 배포용(RAW 비움, TAXO는 정적참조로 유지) — VDI로 옮겨 실 CSV 업로드로 채우는 용도
const outVdi = assemble([], TAXO_DEMO, '데이터 없음 · CSV 업로드로 실 데이터를 불러오세요');
fs.writeFileSync('mockup-vdi.html', outVdi);
console.error('mockup-vdi.html(배포용, 데이터 없음) 작성 완료:', outVdi.length, 'bytes');
