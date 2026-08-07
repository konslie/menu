/* ── Option C: 단일 캔버스 인라인 아코디언 ── */
let MODE='service', SORT='service', ROWS=[], TOT=null, INDS=[];
const OPEN=new Set(); // 펼쳐진 업종
function recalc(){ROWS=aggAll();TOT=aggTotal(ROWS);INDS=aggIndustry(ROWS).sort((a,b)=>indRank(a.industry)-indRank(b.industry));}
const periodLabel=()=>YEAR==='2026'?'2026 YTD':'2025 연간';
function show(id){['vTotal','vAll'].forEach(v=>$(v).classList.toggle('hidden',v!==id));scrollTo(0,0);}

const AXCOLOR={'AX|||Infra':'rgba(155,9,80,.92)','AX|||Application':'rgba(155,9,80,.62)',
  'Legacy|||Infra':'rgba(28,27,27,.62)','Legacy|||Application':'rgba(28,27,27,.34)'};

/* STEP 1 스트립 + 스택바 */
function renderTotal(){
  ['pdT','pdA'].forEach(x=>$(x).textContent=periodLabel());
  const p=TOT.usedCodes/TOT.catalog;
  $('cvKpi').innerHTML=`${TOT.usedCodes}<em> / ${TOT.catalog}종 (${Math.round(p*100)}%)</em>`;
  $('cvKpiBar').style.width=Math.round(p*100)+'%';
  $('cCust').innerHTML=`${TOT.n}<em>개사</em>`;
  const ap=TOT.avgUsed/TOT.usedCodes;
  $('cPen').innerHTML=`${TOT.avgUsed.toFixed(1)}<em> / ${TOT.usedCodes}종</em>`;
  $('cPenBar').style.width=Math.round(ap*100)+'%';
  $('cRev').innerHTML=`${fmt0(TOT.salesTotal)}<em>억원</em>`;

  const isSvc=MODE==='service';
  $('stackTitle').textContent=isSvc?'AX 구분별 사용 상품 종수 구성':'AX 구분별 매출 구성';
  const vals=TOT.perAx.map(a=>isSvc?a.used:a.sales),sum=vals.reduce((s,v)=>s+v,0)||1;
  $('stack').innerHTML=TOT.perAx.map((a,i)=>{const w=vals[i]/sum*100;
    return `<i style="width:${w}%;background:${AXCOLOR[a.key]}"><span>${w>9?Math.round(w)+'%':''}</span></i>`}).join('');
  $('stackLg').innerHTML=TOT.perAx.map((a,i)=>`<span><i style="background:${AXCOLOR[a.key]}"></i>${esc(a.label)} · ${isSvc?a.used+'/'+a.cap+'종':fmt0(a.sales)+'억원'} (${Math.round(vals[i]/sum*100)}%)</span>`).join('');

  $('sb1').textContent=`카탈로그 ${TOT.catalog}종 중 ${TOT.usedCodes}종 사용 · ${fmt0(TOT.salesTotal)}억원`;
  $('sb2').textContent=`${INDS.length}개 업종 · ${TOT.n}개사`;
}

/* STEP 2+3 아코디언 */
function renderAcc(){
  const maxAvg=Math.max(...INDS.map(g=>g.usedSum/g.n)),maxRev=Math.max(...INDS.map(g=>g.salesTotal));
  const isSvc=MODE==='service';
  $('acc').innerHTML=INDS.map(g=>{
    const avg=g.usedSum/g.n,r=isSvc?avg/maxAvg:g.salesTotal/maxRev,pc=Math.round(avg/g.codes.size*100),op=OPEN.has(g.industry);
    return `<div class="accrow${op?' open':''}" data-row="${esc(g.industry)}">
      <button class="acchead" data-ind="${esc(g.industry)}">
        <span class="ar">›</span>
        <span class="nm">${esc(g.industry)}</span>
        <span class="ct">${g.n}개사</span>
        <span class="bar"><i style="width:${Math.max(r*100,4)}%;background:rgba(155,9,80,${heat(r)})"></i>
          <span style="color:${r>.35?'#fff':'#9b0950'}">${isSvc?avg.toFixed(1)+'종 평균 ('+pc+'%)':fmt0(g.salesTotal)+'억원'}</span></span>
        <span class="num">${g.codes.size}종<small>업종 사용 상품</small></span>
        <span class="num">${fmt0(g.salesTotal)}<small>매출(억원)</small></span>
      </button>
      <div class="accbody">${op?custTable(g):''}</div></div>`}).join('');
  $('acc').querySelectorAll('[data-ind]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.ind;OPEN.has(k)?OPEN.delete(k):OPEN.add(k);renderAcc();updateStep3()});
  updateStep3();
}
function updateStep3(){
  const n=OPEN.size,btn=$('stepbar').querySelector('[data-step="3"]');
  btn.disabled=n===0;
  $('sb3').textContent=n?`${[...OPEN].join(', ')} 펼침 (${ROWS.filter(a=>OPEN.has(a.industry)).length}개사)`:'업종을 선택하세요';
  // 1·2단계는 항상 도달 상태, 3단계는 업종을 펼쳤을 때만 활성 표시
  $('stepbar').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.step==='3'?n>0:false));
}

/* 업종 내 고객 표 */
function custTable(g){
  const list=ROWS.filter(a=>a.industry===g.industry)
    .sort((a,b)=>(MODE==='service'?b.usedTotal-a.usedTotal:b.salesTotal-a.salesTotal)||a.name.localeCompare(b.name,'ko'));
  const max={};AXKEYS.forEach(k=>max[k]=Math.max(1,...list.map(a=>a.data[k].sales)));
  const isSvc=MODE==='service';
  return `<table><thead><tr><th style="text-align:left;padding-left:14px">고객</th>
    ${AXKEYS.map(k=>`<th>${k.replace('|||',' · ')}</th>`).join('')}
    <th>${isSvc?'총 사용상품':'총매출(억)'}</th></tr></thead><tbody>
    ${list.map(a=>`<tr><td class="nm">${esc(a.name)}</td>
      ${AXKEYS.map(k=>{const d=a.data[k],v=isSvc?d.used:d.sales;
        if(v===0)return '<td class="c"><span class="cell zero">-</span></td>';
        const rt=isSvc?d.used/Math.max(1,d.cap):d.sales/max[k],al=heat(rt);
        return `<td class="c"><span class="cell" style="background:rgba(155,9,80,${al});color:${al>.45?'#fff':'#9b0950'}">${isSvc?d.used+'/'+d.cap:fmt(d.sales)}</span></td>`}).join('')}
      <td class="n">${isSvc?a.usedTotal+'종':fmt(a.salesTotal)}</td></tr>`).join('')}
    </tbody></table>
    <div class="accfoot">${esc(g.industry)} 소계 — 고객 ${g.n}개사 · 업종 사용 상품 ${g.codes.size}종 · 고객당 평균 ${(g.usedSum/g.n).toFixed(1)}종 · 매출 ${fmt0(g.salesTotal)}억원</div>`;
}

/* 전체 53개사 */
function renderAll(){
  const list=ROWS.slice().sort((a,b)=>(SORT==='service'?b.usedTotal-a.usedTotal:b.salesTotal-a.salesTotal)||a.name.localeCompare(b.name,'ko'));
  const max={};AXKEYS.forEach(k=>max[k]=Math.max(1,...list.map(a=>a.data[k].sales)));
  const isSvc=MODE==='service';
  $('aCellMeaning').textContent=isSvc?'사용 서비스 수(사용/사용가능)':'매출(억원)';
  $('aHead').innerHTML=`<tr><th class="rk" rowspan="2">#</th><th class="cust-h" rowspan="2">고객</th>`
    +axMajors().map(m=>`<th colspan="${m.children.length}">${m.name}</th>`).join('')
    +`<th class="total-h" rowspan="2">${isSvc?'총<br>사용상품':'총매출(억)'}</th></tr><tr>`
    +axMajors().flatMap(m=>m.children.map(k=>`<th>${axLabel(k)}<br><small>${capByAx[k]}종</small></th>`)).join('')+'</tr>';
  $('aBody').innerHTML=list.map((a,i)=>`<tr><td class="rk">${i+1}</td>
    <td class="cust">${esc(a.name)} <span class="chip mute">${esc(a.industry)}</span></td>
    ${AXKEYS.map(k=>{const d=a.data[k],v=isSvc?d.used:d.sales;
      if(v===0)return '<td><div class="cell empty"></div></td>';
      const rt=isSvc?d.used/Math.max(1,d.cap):d.sales/max[k],al=heat(rt);
      return `<td><div class="cell" style="background:rgba(155,9,80,${al});color:${al>.45?'#fff':'#9b0950'}">${isSvc?d.used+'/'+d.cap:fmt(d.sales)}</div></td>`}).join('')}
    <td class="total">${isSvc?a.usedTotal+'종':fmt(a.salesTotal)}</td></tr>`).join('');
}

/* 바인딩 */
const rerender=()=>{renderTotal();renderAcc();renderAll()};
$('segYear').onclick=e=>{const b=e.target.closest('button');if(!b)return;YEAR=b.dataset.y;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle('active',x===b));recalc();rerender()};
$('segMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;MODE=SORT=b.dataset.m;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle('active',x===b));
  [...$('segSort').children].forEach(x=>x.classList.toggle('active',x.dataset.s===SORT));rerender()};
$('segSort').onclick=e=>{const b=e.target.closest('button');if(!b)return;SORT=MODE=b.dataset.s;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle('active',x===b));
  [...$('segMode').children].forEach(x=>x.classList.toggle('active',x.dataset.m===MODE));rerender()};
$('expandAll').onclick=()=>{INDS.forEach(g=>OPEN.add(g.industry));renderAcc()};
$('collapseAll').onclick=()=>{OPEN.clear();renderAcc()};
$('stepbar').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  ({1:'vTotal',2:'acc',3:'acc'})[b.dataset.step]==='vTotal'?scrollTo({top:0,behavior:'smooth'})
    :$('acc').scrollIntoView({behavior:'smooth',block:'start'})};
$('goAllA').onclick=()=>{renderAll();show('vAll')};
$('backT2').onclick=()=>show('vTotal');
document.querySelectorAll('[data-nav]').forEach(a=>a.onclick=()=>show('vTotal'));

recalc();rerender();show('vTotal');
