/* ── Option A: 화면 전환 + 렌더 ── */
let MODE='service', SORT='service', CUR_IND=null, ROWS=[], TOT=null, INDS=[];

function recalc(){ROWS=aggAll();TOT=aggTotal(ROWS);INDS=aggIndustry(ROWS).sort((a,b)=>indRank(a.industry)-indRank(b.industry));}
const periodLabel=()=>YEAR==='2026'?'2026 YTD':'2025 연간';

function show(id){['vTotal','vInd','vCust','vAll'].forEach(v=>$(v).classList.toggle('hidden',v!==id));scrollTo(0,0);}

/* STEP 1 */
function renderTotal(){
  ['pdT','pdI','pdA'].forEach(x=>$(x).textContent=periodLabel());
  const pct=Math.round(TOT.usedCodes/TOT.catalog*100);
  $('kCat').innerHTML=`${TOT.usedCodes}<em> / ${TOT.catalog}종</em>`;
  $('kCatBar').style.width=pct+'%';
  $('kCatNote').textContent=`카탈로그 침투 ${pct}% · 미개척 ${TOT.catalog-TOT.usedCodes}종`;
  $('kCust').innerHTML=`${TOT.n}<em>개사</em>`;
  const avgPct=Math.round(TOT.avgUsed/TOT.usedCodes*100);
  $('kPen').innerHTML=`${TOT.avgUsed.toFixed(1)}<em> / ${TOT.usedCodes}종 (${avgPct}%)</em>`;
  $('kPenBar').style.width=avgPct+'%';
  $('kPenNote').textContent=`고객 1개사가 평균 ${TOT.avgUsed.toFixed(1)}종 사용`;
  $('kRev').innerHTML=`${fmt0(TOT.salesTotal)}<em>억원</em>`;
  $('kRevNote').textContent=`고객당 평균 ${fmt0(TOT.salesTotal/TOT.n)}억원`;

  $('axCards').innerHTML=TOT.perAx.map(a=>{
    const r=a.owners/a.n,pc=Math.round(r*100);
    return `<div class="axcard"><div class="h">${esc(a.label)}</div><div class="bd">
      <div class="big">${pc}%<small> 고객 침투 (${a.owners}/${a.n}개사)</small></div>
      <div class="bar"><i style="width:${Math.max(pc,3)}%;background:rgba(155,9,80,${heat(r)})"></i></div>
      <div class="sub2">상품 ${a.used}/${a.cap}종 사용 · 매출 ${fmt0(a.sales)}억원</div>
    </div></div>`}).join('');
}

/* STEP 2 */
function renderInd(){
  const maxAvg=Math.max(...INDS.map(g=>g.usedSum/g.n));
  $('indBody').innerHTML=INDS.map(g=>{
    const avg=g.usedSum/g.n,r=avg/maxAvg,pc=Math.round(avg/g.codes.size*100);
    return `<tr data-ind="${esc(g.industry)}">
      <td class="name">${esc(g.industry)}</td>
      <td class="c">${g.n}개사</td>
      <td class="n"><span class="mini"><i style="width:${Math.max(r*100,4)}%;background:rgba(155,9,80,${heat(r)})"></i></span>${avg.toFixed(1)}종 <small>/ ${g.codes.size}종 (${pc}%)</small></td>
      <td class="c">${g.codes.size}종</td>
      <td class="n">${fmt0(g.salesTotal)}</td>
      <td class="n">${fmt0(g.salesTotal/g.n)}</td>
      <td class="go">›</td></tr>`}).join('')
   +(()=>{const n=INDS.reduce((s,g)=>s+g.n,0),sv=INDS.reduce((s,g)=>s+g.salesTotal,0),us=INDS.reduce((s,g)=>s+g.usedSum,0);
     return `<tr class="sum"><td class="name">합계</td><td class="c">${n}개사</td>
      <td class="n">${(us/n).toFixed(1)}종 <small>/ ${TOT.usedCodes}종</small></td>
      <td class="c">${TOT.usedCodes}종</td><td class="n">${fmt0(sv)}</td><td class="n">${fmt0(sv/n)}</td><td></td></tr>`})();
  $('indBody').querySelectorAll('tr[data-ind]').forEach(tr=>tr.onclick=()=>{CUR_IND=tr.dataset.ind;renderCust();show('vCust')});
}

/* 히트맵 헤더 / 행 공용 */
function headHtml(withRank){
  const mj=axMajors(),tot=MODE==='service'?'총<br>사용상품':'총매출(억)';
  return `<tr>${withRank?'<th class="rk" rowspan="2">#</th>':''}<th class="cust-h" rowspan="2">고객</th>`
   +mj.map(m=>`<th colspan="${m.children.length}">${m.name}</th>`).join('')
   +`<th class="total-h" rowspan="2">${tot}</th></tr><tr>`
   +mj.flatMap(m=>m.children.map(k=>`<th>${axLabel(k)}<br><small>${capByAx[k]}종</small></th>`)).join('')+'</tr>';
}
function cellsHtml(a,max){
  return AXKEYS.map(k=>{const d=a.data[k],v=MODE==='service'?d.used:d.sales;
    if(v===0)return '<td><div class="cell empty"></div></td>';
    const r=MODE==='service'?d.used/Math.max(1,d.cap):d.sales/max[k],al=heat(r);
    return `<td><div class="cell" style="background:rgba(155,9,80,${al});color:${al>.45?'#fff':'#9b0950'}">${MODE==='service'?d.used+'/'+d.cap:fmt(d.sales)}</div></td>`}).join('');
}
const maxByAx=rows=>{const m={};AXKEYS.forEach(k=>m[k]=Math.max(1,...rows.map(a=>a.data[k].sales)));return m};

/* STEP 3 */
function renderCust(){
  const list=ROWS.filter(a=>a.industry===CUR_IND)
    .sort((a,b)=>(MODE==='service'?b.usedTotal-a.usedTotal:b.salesTotal-a.salesTotal)||a.name.localeCompare(b.name,'ko'));
  const g=INDS.find(x=>x.industry===CUR_IND),max=maxByAx(list);
  $('cbInd').textContent=CUR_IND;
  $('custTitle').innerHTML=`${esc(CUR_IND)} 고객 ${list.length}개사<span class="b-period">${periodLabel()}</span>`;
  $('custSub').textContent=`업종 소계: 사용 상품 ${g.codes.size}종 · 매출 ${fmt0(g.salesTotal)}억원 · 고객당 평균 ${(g.usedSum/g.n).toFixed(1)}종`;
  $('cCellMeaning').textContent=MODE==='service'?'사용 서비스 수(사용/사용가능)':'매출(억원)';
  $('cHead').innerHTML=headHtml(false);
  $('cBody').innerHTML=list.map(a=>`<tr><td class="cust">${esc(a.name)}</td>${cellsHtml(a,max)}<td class="total">${MODE==='service'?a.usedTotal+'종':fmt(a.salesTotal)}</td></tr>`).join('');
}

/* 전체 53개사 */
function renderAll(){
  const list=ROWS.slice().sort((a,b)=>(SORT==='service'?b.usedTotal-a.usedTotal:b.salesTotal-a.salesTotal)||a.name.localeCompare(b.name,'ko'));
  const max=maxByAx(list);
  $('aHead').innerHTML=headHtml(true);
  $('aBody').innerHTML=list.map((a,i)=>`<tr><td class="rk">${i+1}</td><td class="cust">${esc(a.name)} <span class="chip mute">${esc(a.industry)}</span></td>${cellsHtml(a,max)}<td class="total">${MODE==='service'?a.usedTotal+'종':fmt(a.salesTotal)}</td></tr>`).join('');
}

/* ── 바인딩 ── */
$('segYear').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  YEAR=b.dataset.y;[...e.currentTarget.children].forEach(x=>x.classList.toggle('active',x===b));
  recalc();renderTotal();renderInd();if(CUR_IND)renderCust();renderAll()};
$('segMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  MODE=b.dataset.m;SORT=MODE;[...e.currentTarget.children].forEach(x=>x.classList.toggle('active',x===b));
  [...$('segSort').children].forEach(x=>x.classList.toggle('active',x.dataset.s===SORT));
  if(CUR_IND)renderCust();renderAll()};
$('segSort').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  SORT=b.dataset.s;MODE=SORT;[...e.currentTarget.children].forEach(x=>x.classList.toggle('active',x===b));
  [...$('segMode').children].forEach(x=>x.classList.toggle('active',x.dataset.m===MODE));
  renderAll();if(CUR_IND)renderCust()};
$('goInd').onclick=()=>show('vInd');
$('backT').onclick=$('backT2').onclick=()=>show('vTotal');
$('backI').onclick=()=>show('vInd');
['goAllA','goAllB','goAllC'].forEach(id=>$(id).onclick=()=>{renderAll();show('vAll')});
document.querySelectorAll('[data-nav]').forEach(a=>a.onclick=()=>show(a.dataset.nav==='total'?'vTotal':'vInd'));

recalc();renderTotal();renderInd();renderAll();show('vTotal');
