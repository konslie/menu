import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.join(path.dirname(new URL(import.meta.url).pathname), 'mockup_v2-vdi.html');
const html = await fs.readFile(file, 'utf8');

const required = [
  'let CATALOG=[];',
  'let CUSTOMERS=[];',
  'let RAW=[];',
  'id="uploadBtn"',
  'id="saveFileBtn"',
  'industryCompareView',
  'peerCompareView',
  'M2M차량',
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`VDI marker missing: ${marker}`);
}
if (html.includes('let CUSTOMERS=[{')) throw new Error('VDI must not embed customer data');
console.log(`Verified ${file}: empty initial data, CSV upload/save, industry and peer comparison UI present.`);
