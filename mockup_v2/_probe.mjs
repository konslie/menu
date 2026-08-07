/* 시안 HTML을 headless Chrome으로 열어 드릴다운 인터랙션을 실제로 클릭해 검증.
   사용: node _probe.mjs a b c */
import fs from 'fs';
import { execFileSync } from 'child_process';
import os from 'os';
import path from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = new URL('./', import.meta.url);

/* 시안 C는 화면 전환이 아니라 제자리 아코디언이므로 별도 probe를 쓴다. */
const PROBE_C = `<script>
window.addEventListener('load',()=>{
  const L=[],ok=(k,v)=>L.push(k+': '+v);
  const q=s=>document.querySelectorAll(s).length;
  try{
    ok('kpi_headline',document.getElementById('cvKpi').textContent.replace(/\\s+/g,' ').trim());
    ok('industry_rows',q('.acchead[data-ind]'));
    ok('open_rows_initial',q('.accrow.open'));
    ok('step3_disabled_initial',document.querySelector('[data-step="3"]').disabled);
    // 업종 펼치기 → 고객 표가 그 자리에 생기는지
    document.querySelector('.acchead[data-ind]').click();
    ok('open_rows_after_click',q('.accrow.open'));
    ok('customer_rows_inline',q('.accrow.open .accbody tbody tr'));
    ok('step3_enabled_after_open',!document.querySelector('[data-step="3"]').disabled);
    // 두 업종 동시 펼침(시안 C의 핵심 차별점)
    document.querySelectorAll('.acchead[data-ind]')[2].click();
    ok('open_rows_two',q('.accrow.open'));
    // 접기
    document.getElementById('collapseAll').click();
    ok('open_rows_after_collapse',q('.accrow.open'));
    document.getElementById('expandAll').click();
    ok('open_rows_expand_all',q('.accrow.open'));
    ok('all_inline_customer_rows',q('.accbody tbody tr'));
    // 전체 53개사 화면
    document.getElementById('goAllA').click();
    ok('all_view_visible',!document.getElementById('vAll').classList.contains('hidden'));
    ok('all_rows',q('#aBody tr'));
    document.querySelector('#segSort button[data-s="sales"]').click();
    ok('after_sort_sales',q('#aBody tr'));
    document.getElementById('backT2').click();
    ok('back_to_total',!document.getElementById('vTotal').classList.contains('hidden'));
    document.querySelector('#segYear button[data-y="2025"]').click();
    ok('after_year2025',document.getElementById('cvKpi').textContent.replace(/\\s+/g,' ').trim());
  }catch(e){L.push('ERROR: '+e.message+' @ '+(e.stack||'').split('\\n')[1])}
  document.body.innerHTML='<pre id="out">'+L.join('\\n')+'</pre>';
});
</scr`+`ipt>`;

const PROBE = `<script>
window.addEventListener('load',()=>{
  const L=[],ok=(k,v)=>L.push(k+': '+v);
  const vis=id=>{const e=document.getElementById(id);return e&&!e.classList.contains('hidden')};
  const shown=()=>['vTotal','vInd','vCust','vAll'].filter(vis).join(',');
  const cells=sel=>document.querySelectorAll(sel).length;
  // 시안마다 헤드라인 KPI를 담는 요소가 다르므로 후보를 순회
  const headline=()=>{for(const id of ['kCat','hCat2','donut','cvKpi']){const e=document.getElementById(id);
    if(e)return e.textContent.replace(/\\s+/g,' ').trim()}return '(n/a)'};
  try{
    ok('step1_visible',shown());
    ok('kpi_catalog',headline());
    // STEP1 -> STEP2
    document.getElementById('goInd').click();
    ok('after_goInd',shown());
    ok('industry_rows',cells('[data-ind]'));
    // STEP2 -> STEP3 (첫 업종 클릭)
    document.querySelector('[data-ind]').click();
    ok('after_industry_click',shown());
    ok('customer_rows',cells('#cBody tr, #cList .crow'));
    // 뒤로가기
    document.getElementById('backI').click();
    ok('after_backI',shown());
    document.getElementById('backT').click();
    ok('after_backT',shown());
    // 전체 53개사
    document.getElementById('goAllA').click();
    ok('after_goAll',shown());
    ok('all_rows',cells('#aBody tr, #aList .crow'));
    // 정렬 토글
    const s=document.querySelector('#segSort button[data-s="sales"]');
    if(s){s.click();ok('after_sort_sales',shown()+' rows='+cells('#aBody tr, #aList .crow'));}
    document.getElementById('backT2').click();
    ok('after_backT2',shown());
    // 연도 토글
    const y=document.querySelector('#segYear button[data-y="2025"]');
    if(y){y.click();ok('after_year2025',headline());}
  }catch(e){L.push('ERROR: '+e.message+' @ '+(e.stack||'').split('\\n')[1])}
  document.title='PROBE::'+L.join(' | ');
  document.body.innerHTML='<pre id="out">'+L.join('\\n')+'</pre>';
});
</script>`;

let bad = 0;
for (const k of process.argv.slice(2)) {
  const src = fs.readFileSync(new URL(`mockup_v2_option-${k}.html`, dir), 'utf8');
  const tmp = path.join(os.tmpdir(), `probe_${k}_${Date.now()}.html`);
  fs.writeFileSync(tmp, src.replace('</body>', (k === 'c' ? PROBE_C : PROBE) + '</body>'));
  const out = execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=4000', '--dump-dom', 'file://' + tmp,
  ], { encoding: 'utf8', maxBuffer: 1 << 26 });
  fs.unlinkSync(tmp);
  const m = out.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  console.log(`\n══ 시안 ${k.toUpperCase()} ══`);
  if (!m) { console.log('렌더 실패 — probe 출력 없음'); bad++; continue; }
  const body = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  console.log(body);
  if (/ERROR:/.test(body)) bad++;
}
process.exit(bad ? 1 : 0);
