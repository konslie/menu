import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, 'mockup_v2.html');
const html = await fs.readFile(file, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(!html.includes('const rng='), 'Synthetic data generator remains in the built file.');
assert(html.includes('M2M차량'), 'M31 normalization is missing.');
assert(html.includes('const FULL_CATALOG_TOTAL=132'), 'Full portfolio count is missing.');
assert(html.includes('const KA_PRODUCT_TOTAL=63'), 'KA denominator is missing.');
assert(!html.includes('id="segCovSort"'), 'Coverage sort control should be removed.');
assert(html.includes('평균매출'), 'Average revenue column is missing.');
assert(html.includes('id="modeBar"'), 'Industry/customer mode bar is missing.');
assert(html.includes('사용상품비중'), 'Usage-share mode label is missing.');
assert(html.includes('전체상품') && html.includes('사용상품'), 'Usage/catalog columns are missing.');
assert(!html.includes('>서비스 수<'), 'Legacy service-count label remains.');
assert(html.includes('id="taxonomyBtn"') && html.includes('id="uploadBtn"') && html.includes('id="saveFileBtn"'), 'Main data feature controls are missing.');
assert(html.includes('function applyUploadedRows') && html.includes('function saveCurrentFile'), 'CSV upload/save logic is missing.');
assert(html.includes('id="dtCompareIndustry"') && html.includes('id="dtComparePeers"'), 'Comparison entry points are missing.');
assert(html.includes('function renderIndustryCompare') && html.includes('function renderPeerCompare'), 'Comparison view logic is missing.');
assert(!html.includes('id="axInd"') && !html.includes('id="axCust"'), 'Redundant matrix axis labels remain.');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
assert(duplicates.length === 0, `Duplicate ids: ${[...new Set(duplicates)].join(', ')}`);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
assert(scripts.length === 1, 'Expected one inline application script.');
new Function(scripts[0]);

class MockClassList {
  constructor() { this.values = new Set(); }
  contains(value) { return this.values.has(value); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  toggle(value, force) {
    if (force === undefined) force = !this.values.has(value);
    force ? this.values.add(value) : this.values.delete(value);
    return force;
  }
}
class MockElement {
  constructor(id) { this.id = id; this.innerHTML = ''; this.textContent = ''; this.children = []; this.dataset = {}; this.style = {}; this.hidden = false; this.classList = new MockClassList(); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  querySelectorAll(selector) {
    if (selector === 'input:checked') {
      return [...this.innerHTML.matchAll(/<input[^>]*value="([^"]+)"[^>]*checked/g)].map((m) => ({ value: m[1] }));
    }
    return [];
  }
}

const elements = new Map(ids.map((id) => [id, new MockElement(id)]));
const documentMock = { getElementById: (id) => elements.get(id) || null };
new Function('document', 'scrollTo', scripts[0])(documentMock, () => {});

assert(elements.get('cCust').innerHTML.startsWith('53'), 'Customer count did not reconcile to 53.');
assert(elements.get('cvKpi').innerHTML.includes('63') && elements.get('cvKpi').innerHTML.includes('132'), 'Top product KPI does not show 63 / 132 context.');
assert(elements.get('cPen').innerHTML.includes('38.4%'), 'Aggregate wallet share is unexpected.');
assert(elements.get('hbAx').innerHTML.includes('Legacy') && elements.get('hbAx').innerHTML.includes('Application'), 'KA 전체 default hierarchy did not open to the middle level.');
assert(!/<div class="cov-row level-3/.test(elements.get('hbAx').innerHTML), 'KA 전체 default should keep detail products collapsed.');
assert(!html.includes('매출(억원/원)') && !html.includes('평균매출(억원/원)'), 'Deprecated revenue unit labels remain.');
assert(!html.includes('제공시점 기준'), 'Deprecated wallet timing note remains.');
assert(!html.includes('업종 행을 누르면'), 'Global industry interaction note remains.');
assert(html.includes('.g5-nm small{display:none}'), 'Responsive industry/customer labels are not protected from collapsing.');
assert(elements.get('modeBar').style.display === 'none', 'Mode bar should be hidden on KA 전체.');
elements.get('taxonomyBtn').onclick();
assert(elements.get('taxonomyBody').innerHTML.includes('M2M차량') && elements.get('taxonomyHead').innerHTML.includes('고객소통명'), 'Product taxonomy did not render the built catalog.');
elements.get('segGran').onclick({ target: { closest: () => ({ dataset: { g: 'svc' } }) }, currentTarget: { children: [] } });
assert(elements.get('hbAx').innerHTML.includes('M2M차량'), 'Normalized product is not in the product view.');
assert(elements.get('hbAx').innerHTML.includes('<div class="cov-rev">-</div>'), 'Zero revenue should be shown as a dash.');
assert(elements.get('hbAx').innerHTML.includes('<div class="cov-rev">0.20억</div>'), 'Sub-0.5억 revenue should retain decimal precision.');
assert(elements.get('hbAx').innerHTML.includes('0.97백'), 'Sub-million-won values should use the 백 unit.');
assert(!elements.get('hbAx').innerHTML.includes('0.00백'), 'Meaningless zero-rounded 백 values remain.');
elements.get('segGran').onclick({ target: { closest: () => ({ dataset: { g: 'cat' } }) }, currentTarget: { children: [] } });

const tabEvent = (tab) => ({ target: { closest: () => ({ dataset: { tab } }) } });
elements.get('tabs').onclick(tabEvent('ind'));
assert(elements.get('hbInd').innerHTML.length > 0 && elements.get('hbInd').innerHTML.includes('월렛'), 'Industry view did not render wallet context.');
assert(elements.get('modeBar').style.display === 'flex', 'Mode bar should be visible on industry view.');
assert(elements.get('hbInd').innerHTML.includes('class="g5-metric wallet"') && elements.get('hbInd').innerHTML.includes('class="g5-metric revenue"') && elements.get('hbInd').innerHTML.includes('class="g5-metric products"'), 'Total metrics are not split into wallet, revenue, and product columns.');
elements.get('segMode').onclick({ target: { closest: () => ({ dataset: { m: 'sales' } }) }, currentTarget: { children: [] } });
assert(elements.get('hbInd').innerHTML.includes('class="g5-metric wallet"') && elements.get('hbInd').innerHTML.includes('class="g5-metric revenue"') && elements.get('hbInd').innerHTML.includes('class="g5-metric products"'), 'Total metrics changed with the matrix mode toggle.');
elements.get('tabs').onclick(tabEvent('cust'));
assert(elements.get('hbCust').innerHTML.length > 0 && elements.get('hbCust').innerHTML.includes('월렛'), 'Customer view did not render wallet context.');
assert(!elements.get('hbCust').innerHTML.includes('1. 고객'), 'Customer numbering should not be shown.');

elements.get('hbAx').onclick({ target: { closest: (selector) => selector === '.chip' ? { dataset: { cust: 'cust001' } } : null } });
assert(elements.get('dtName').textContent === '고객 001', 'Customer detail did not open.');
assert(elements.get('dtWallet').innerHTML.includes('23.2%'), 'Customer wallet share did not render.');
assert(elements.get('dtBlocks').innerHTML.includes('class="dt-r used"'), 'Detail product rows are not using the compact product/value layout.');
assert(html.includes('추천 로직</b> : Key Account') && html.includes('추천 우선순위</b>'), 'Detail recommendation guidance copy is missing.');
assert(html.includes('class="dt-reco-note"'), 'Detail recommendation guidance background is missing.');
assert(html.includes('id="dtSales" class="accent-num"'), 'Detail KPI theme does not match the main KPI strip.');

elements.get('dtCompareIndustry').onclick();
assert(elements.get('industryCompareView').innerHTML.includes('전체 KA') && elements.get('industryCompareView').innerHTML.includes('동종 업종'), 'Industry comparison view did not render.');
elements.get('industryResultBack').onclick();
elements.get('dtComparePeers').onclick();
elements.get('peerChecks').innerHTML='<input type="checkbox" value="cust001" checked><input type="checkbox" value="cust002" checked>';
elements.get('peerCompareGo').onclick();
assert(elements.get('peerCompareView').innerHTML.includes('공통') || elements.get('peerCompareView').innerHTML.includes('미침투'), 'Peer comparison matrix did not render.');
elements.get('peerResultBack').onclick();

elements.get('dtBack').onclick();
elements.get('hbAx').onclick({ target: { closest: (selector) => selector === '.chip' ? { dataset: { cust: 'cust050' } } : null } });
assert(elements.get('dtWallet').innerHTML.includes('미산정'), 'Missing wallet customer was not marked as unestimated.');

elements.get('segYear').onclick({ target: { closest: () => ({ dataset: { y: '2025' } }) }, currentTarget: { children: [] } });
assert(elements.get('cRev').innerHTML.includes('7,474'), '2025 revenue did not reconcile.');
console.log(`Verified ${file}: 53 customers, 63 KA denominator, M31 normalized, wallet share and period switching.`);
