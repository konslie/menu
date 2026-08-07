/* ── Option B: 도넛/바 차트 + 업종 카드 그리드 ── */
let MODE='service', SORT='service', CUR_IND=null, ROWS=[], TOT=null, INDS=[];
function recalc(){ROWS=aggAll();TOT=aggTotal(ROWS);INDS=aggIndustry(ROWS).sort((a,b)=>indRank(a.industry)-indRank(b.industry));}
const periodLabel=()=>YEAR==='2026'?'2026 YTD':'2025 연간';
function show(id){['vTotal','vInd','vCust','vAll'].forEach(v=>$(v).classList.toggle('hidden',v!==id));scrollTo(0,0);}

/* SVG 링: 반지름 r, 두께 w, 비율 p */
function ring(size,w,p,color,track){
  const r=(size-w)/2,c=2*Math.PI*r,cx=size/2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${track}" stroke-width="${w}"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"
      stroke-dasharray="${(c*p).toFixed(2)} ${c.toFixed(2)}" stroke-linecap="round"/></svg>`;
}

/* STEP 1 */
function renderTotal(){
  ['pdT','pdI','pdA'].forEach(x=>$(x).textContent=periodLabel());
  const p=TOT.usedCodes/TOT.catalog;
  $('donut').innerHTML=ring(236,26,p,'#ff2d92','rgba(250,249,245,.18)')
    +`<div class="mid"><b>${TOT.usedCodes}</b><span>/ ${TOT.catalog}종 사용</span><em>카탈로그 침투 ${Math.round(p*100)}%</em></div>`;
  $('hCat').textContent=TOT.catalog+'종';
  $('hCust').innerHTML=`${TOT.n}<em>개사</em>`;
  $('hPen').innerHTML=`${TOT.avgUsed.toFixed(1)}<em> / ${TOT.usedCodes}종</em>`;
  $('hRev').innerHTML=`${fmt0(TOT.salesTotal)}<em>억원</em>`;
  $('hNote').textContent=`미개척 ${TOT.catalog-TOT.usedCodes}종`;

  const maxSales=Math.max(...TOT.perAx.map(a=>a.sales));
  $('axBars').innerHTML=TOT.perAx.map(a=>{
    const r=a.owners/a.n,pc=Math.round(r*100),sw=Math.max(a.sales/maxSales*100,2);
    const w=MODE==='service'?Math.max(pc,2):sw;
    return `<div class="barrow"><div class="nm">${esc(a.label)}</div>
      <div class="tr"><i style="width:${w}%;background:rgba(155,9,80,${heat(r)})"></i>
        <span style="color:${w>22?'#fff':'#9b0950'}">${MODE==='service'?pc+'% ('+a.owners+'/'+a.n+'개사)':fmt0(a.sales)+'억원'}</span></div>
      <div class="mt">상품 ${a.used}/${a.cap}종 · ${MODE==='service'?fmt0(a.sales)+'억원':pc+'% 침투'}</div></div>`}).join('');
}

/* STEP 2 */
function renderInd(){
  $('indGrid').innerHTML=INDS.map(g=>{
    const avg=g.usedSum/g.n,p=avg/g.codes.size;
    return `<button class="indcard" data-ind="${esc(g.industry)}">
      <div class="t"><b>${esc(g.industry)}</b><span>${g.n}개사</span></div>
      <div class="ring">${ring(74,10,p,'rgba(155,9,80,'+heat(p)+')','var(--u-border)')}
        <div class="v"><b>${avg.toFixed(1)}종</b><small>고객당 평균 / ${g.codes.size}종 (${Math.round(p*100)}%)</small></div></div>
      <div class="kv">
        <div><small>업종 매출</small><b>${fmt0(g.salesTotal)}억</b></div>
        <div><small>고객당 평균매출</small><b>${fmt0(g.salesTotal/g.n)}억</b></div>
      </div>
      <div class="go">고객 ${g.n}개사 보기 ›</div></button>`}).join('');
  $('indGrid').querySelectorAll('[data-ind]').forEach(b=>b.onclick=()=>{CUR_IND=b.dataset.ind;renderCust();show('vCust')});
}

/* 고객 카드 */
function custCard(a,i,max,showInd){
  const v=MODE==='service'?a.usedTotal:a.salesTotal,mx=MODE==='service'?Math.max(...max.u):Math.max(...max.s);
  const mini=AXKEYS.map(k=>{const d=a.data[k],r=MODE==='service'?d.used/Math.max(1,d.cap):d.sales/Math.max(1,max.ax[k]);
    return `<i style="background:${d.used===0?'var(--u-border)':'rgba(155,9,80,'+heat(r)+')'}" title="${k.replace('|||',' · ')}"></i>`}).join('');
  return `<div class="crow"><div class="rk">${i+1}</div>
    <div class="nm"><b>${esc(a.name)}${showInd?' <span class="chip mute">'+esc(a.industry)+'</span>':''}</b>
      <div class="mini">${mini}</div>
      <div class="lab">사용 ${a.usedTotal}종 · 매출 ${fmt0(a.salesTotal)}억원</div></div>
    <div class="rt"><b>${MODE==='service'?a.usedTotal+'종':fmt0(a.salesTotal)+'억'}</b>
      <small>${MODE==='service'?'사용 상품':'매출'}</small>
      <div class="g"><i style="width:${Math.max(v/mx*100,3)}%"></i></div></div></div>`;
}
const maxOf=rows=>({u:rows.map(a=>a.usedTotal),s:rows.map(a=>a.salesTotal),
  ax:Object.fromEntries(AXKEYS.map(k=>[k,Math.max(1,...rows.map(a=>a.data[k].sales))]))});

/* STEP 3 */
function renderCust(){
  const list=ROWS.filter(a=>a.industry===CUR_IND)
    .sort((a,b)=>(MODE==='service'?b.usedTotal-a.usedTotal:b.salesTotal-a.salesTotal)||a.name.localeCompare(b.name,'ko'));
  const g=INDS.find(x=>x.industry===CUR_IND),max=maxOf(list);
  $('cbInd').textContent=CUR_IND;
  $('custTitle').innerHTML=`${esc(CUR_IND)} 고객 ${list.length}개사<span class="b-period">${periodLabel()}</span>`;
  $('custSub').textContent=`업종 소계: 사용 상품 ${g.codes.size}종 · 매출 ${fmt0(g.salesTotal)}억원 · 고객당 평균 ${(g.usedSum/g.n).toFixed(1)}종`;
  $('cList').innerHTML=list.map((a,i)=>custCard(a,i,max,false)).join('');
}
/* 전체 */
function renderAll(){
  const list=ROWS.slice().sort((a,b)=>(SORT==='service'?b.usedTotal-a.usedTotal:b.salesTotal-a.salesTotal)||a.name.localeCompare(b.name,'ko'));
  const max=maxOf(list);
  $('aList').innerHTML=list.map((a,i)=>custCard(a,i,max,true)).join('');
}

/* 바인딩 */
const syncSegs=()=>{[...$('segMode').children].forEach(x=>x.classList.toggle('active',x.dataset.m===MODE));
  [...$('segSort').children].forEach(x=>x.classList.toggle('active',x.dataset.s===SORT))};
$('segYear').onclick=e=>{const b=e.target.closest('button');if(!b)return;YEAR=b.dataset.y;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle('active',x===b));
  recalc();renderTotal();renderInd();if(CUR_IND)renderCust();renderAll()};
$('segMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;MODE=SORT=b.dataset.m;syncSegs();
  renderTotal();if(CUR_IND)renderCust();renderAll()};
$('segSort').onclick=e=>{const b=e.target.closest('button');if(!b)return;SORT=MODE=b.dataset.s;syncSegs();
  renderTotal();renderAll();if(CUR_IND)renderCust()};
$('goInd').onclick=()=>show('vInd');
$('backT').onclick=$('backT2').onclick=()=>show('vTotal');
$('backI').onclick=()=>show('vInd');
['goAllA','goAllB','goAllC'].forEach(id=>$(id).onclick=()=>{renderAll();show('vAll')});
document.querySelectorAll('[data-nav]').forEach(a=>a.onclick=()=>show(a.dataset.nav==='total'?'vTotal':'vInd'));

recalc();renderTotal();renderInd();renderAll();show('vTotal');
