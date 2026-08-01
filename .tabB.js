/* ══════════ 탭 B: 경영진 뷰 — 합계 관점(개요) + 고객단위 관점(히트맵). 계산은 공유 함수 재사용 ══════════ */
let bYear='2026', bGran='cat', bSort='cov', bMode='service', bPane='cust', bCurrentId=null;
const bExpanded=new Set();
let bAggCache=[];
const LS_KEY='menuRawData';
const LS_KEY_TAXO='menuTaxoData';

const bYearLabel=()=>year==='2026'?'2026 YTD(1~6월)':'2025 연간';
const bAxCatLabel=c=>String(c).replace('|||',' · ');
function bSync(){view='ax';year=bYear;}                 // AX 구분 고정
function bShow(id){['bHome','bDetail','bSelect','bResult','bIndustryResult'].forEach(x=>$(x).classList.toggle('hidden',x!==id));scrollTo(0,0);}
function bRefresh(){bSync();bAggCache=customers.map(c=>agg(c.id));}

/* ── KPI ── */
// NOTE: 화이트스페이스 기준 40%(0.4)가 renderNode()·.tabB.html의 ws-legend 문구에 하드코딩됨 — 기준 변경 시 함께 동기화 필요
function renderKpis(){
  const N=customers.length,totalRev=RAW.reduce((s,r)=>s+Number(r[salesField()]||0),0);
  const avg=(bAggCache.reduce((s,a)=>s+a.usedTotal,0)/Math.max(1,N)).toFixed(1);
  $('bPeriod').textContent=year==='2026'?'2026 YTD':'2025 연간';
  $('bKpiRev').textContent=fmt(totalRev)+'억원';
  $('bKpiCust').textContent=N+'개사';
  $('bKpiAvg').textContent=avg+'종';
}

/* ── 홈: KPI + 활성 서브뷰 ── */
function renderHome(){
  bRefresh();renderKpis();
  bPane==='ov'?renderOverviewPane():renderCustomersPane();
}

/* ── 합계 관점: 커버리지 / 화이트스페이스 (AX 대분류 → 중분류 → 세부상품) ── */
const bOpenNodes=new Set(); // 펼쳐진 비-리프 노드(레벨1/2) 키 집합

// AX 구분 전용 (axKey = "대분류|||중분류", 예: "AX|||Infra")
function axTopRows(){ // 대분류(AX/Legacy) 단위
  const N=customers.length,subKeys=cats();
  const majors=[...new Set(subKeys.map(c=>c.split('|||')[0]))];
  return majors.map(mj=>{
    const keys=subKeys.filter(c=>c.split('|||')[0]===mj);let rev=0;const owners=new Set();
    bAggCache.forEach(a=>{let used=false;keys.forEach(k=>{const d=a.data[k];if(d){rev+=d.sales;if(d.used>0)used=true;}});if(used)owners.add(a.name);});
    return {key:mj,name:mj,catName:'',used:owners.size,total:N,rev,unusedIds:bAggCache.filter(a=>!owners.has(a.name)).map(a=>a.name)};
  });
}
function axMidRows(topKey){ // 중분류(Infra/Application, 해당 대분류 내) 단위
  const N=customers.length,keys=cats().filter(c=>c.split('|||')[0]===topKey);
  return keys.map(k=>{let used=0,rev=0;bAggCache.forEach(a=>{const d=a.data[k];if(d&&d.used>0)used++;if(d)rev+=d.sales;});
    return {key:k,name:catLabel(k),catName:'',used,total:N,rev,unusedIds:bAggCache.filter(a=>!a.data[k]||a.data[k].used===0).map(a=>a.name)};});
}
function svcRowsInAxKey(axKeyFull){ // 대분류+중분류 안의 세부상품 단위
  const N=customers.length,uni=universe().filter(u=>u.ax===axKeyFull);
  const m=new Map(uni.map(u=>[u.code,{key:u.code,name:u.name,catName:'',used:0,rev:0,total:N,owners:new Set()}]));
  bAggCache.forEach(a=>{const d=a.data[axKeyFull];if(!d)return;d.items.forEach(it=>{const x=m.get(it.code);if(x){x.used++;x.rev+=it.sales;x.owners.add(a.name);}});});
  return [...m.values()].map(x=>({...x,unusedIds:bAggCache.filter(a=>!x.owners.has(a.name)).map(a=>a.name)}));
}

// 세부상품 단위(전체 카테고리 통합, 드릴 없음)
function svcRowsFlat(){
  const N=customers.length,uni=universe(),m=new Map(uni.map(u=>[u.code,{key:u.code,name:u.name,catName:u.ax.replace('|||','·'),used:0,rev:0,total:N,owners:new Set()}]));
  bAggCache.forEach(a=>Object.values(a.data).forEach(d=>d.items.forEach(it=>{const x=m.get(it.code);if(x){x.used++;x.rev+=it.sales;x.owners.add(a.name);}})));
  return [...m.values()].map(x=>({...x,unusedIds:bAggCache.filter(a=>!x.owners.has(a.name)).map(a=>a.name)}));
}

function sortRows(rows){return rows.slice().sort((a,b)=> bSort==='ws' ? (a.used-b.used)||(b.rev-a.rev) : (b.used-a.used)||(b.rev-a.rev));}
function nodeKey(level,path){return level+':'+path.join('>');}
function childrenOf(level,path){
  if(level===1)return axMidRows(path[0]);
  if(level===2)return svcRowsInAxKey(path[1]);
  return [];
}
function covHint(unit,leaf){
  const base=`AX 대>중 · ${unit} 단위 · 커버리지 = Key Account ${customers.length}개사 중 사용 비율.`;
  return leaf?`${base} 행 클릭 시 미사용 고객(크로스셀 대상) 표시.`:`${base} 행 클릭 시 하위 항목 표시.`;
}

function renderNode(row,level,parentPath){
  const path=[...parentPath,row.key],isLeaf=level===3;
  const key=isLeaf?row.key:nodeKey(level,path);
  const open=isLeaf?bExpanded.has(key):bOpenNodes.has(key);
  const ratio=row.used/row.total,pct=Math.round(ratio*100),ws=ratio<0.4; // 0.4 = wsSvcCount()과 동일 기준(하드코딩 중복)
  const opacity=Math.min(.28+ratio*1.1,.98); // 고객별 현황 히트맵과 같은 버건디 농도 단계
  const bar=`<div class="cov-bar"><i style="width:${Math.max(pct,3)}%;background:rgba(155,9,80,${opacity})"></i><span>${pct}%</span></div>`;
  const det=(isLeaf&&open)?`<div class="cov-detail">미사용 <b>${row.unusedIds.length}개사</b> (크로스셀 대상)${row.unusedIds.length?' · '+row.unusedIds.slice(0,40).map(n=>`<span class="chip" data-name="${esc(n)}">${esc(n)}</span>`).join(''):''}</div>`:'';
  const rowHtml=`<div class="cov-row level-${level}${ws?' whitespace':''}${!isLeaf?' drillable':''}" data-level="${level}" data-path="${esc(path.join('>'))}">
    <div class="cov-name">${esc(row.name)}${ws?'<span class="ws-badge">화이트스페이스</span>':''}${row.catName?`<br><span class="cov-cat">${esc(row.catName)}</span>`:''}</div>
    ${bar}<div class="cov-count"><b>${row.used}</b><small>/${row.total}</small></div><div class="cov-rev">${fmt(row.rev)}</div>
    <div class="cov-flag">${open?'▲':'▼'}</div>${det}</div>`;
  let childrenHtml='';
  if(open&&!isLeaf){
    const kids=sortRows(childrenOf(level,path));
    childrenHtml=`<div class="cov-children">${kids.map(k=>renderNode(k,level+1,path)).join('')}</div>`;
  }
  return rowHtml+childrenHtml;
}
function bindCovEvents(){
  $('bCovList').onclick=e=>{
    const chip=e.target.closest('.chip');
    if(chip){bShowDetail(customers.find(c=>c.name===chip.dataset.name)?.id);return;}
    const rowEl=e.target.closest('.cov-row');
    if(!rowEl)return;
    const level=Number(rowEl.dataset.level),path=rowEl.dataset.path.split('>');
    if(level===3){const k=path[path.length-1];bExpanded.has(k)?bExpanded.delete(k):bExpanded.add(k);}
    else{const k=nodeKey(level,path);bOpenNodes.has(k)?bOpenNodes.delete(k):bOpenNodes.add(k);}
    renderOverviewPane();
  };
}
function renderOverviewPane(){
  if(bGran==='svc'){
    const rows=sortRows(svcRowsFlat());
    $('bCovList').innerHTML=rows.map(r=>renderNode(r,3,[])).join('');
    bindCovEvents();
    $('bHint').textContent=covHint('세부상품',true);
    return;
  }
  const top=sortRows(axTopRows());
  $('bCovList').innerHTML=top.map(r=>renderNode(r,1,[])).join('');
  bindCovEvents();
  $('bHint').textContent=covHint('AX 대분류',false);
}

/* ── 고객단위 관점: 고객 × 상품 히트맵 ── */
function bHeadHtml(cs){
  const totLabel=bMode==='service'?'총<br>사용상품':'총매출(억)';
  const mj=majors();
  return `<tr><th class="cust-h" rowspan="2">고객 (업종별)<span class="col-resizer" title="드래그하여 고객명 열 너비 조절"></span></th>${mj.map(m=>`<th class="bc-h1" colspan="${m.children.length}">${esc(m.name)}</th>`).join('')}<th class="total-h" rowspan="2">${totLabel}</th></tr><tr>${mj.flatMap(m=>m.children.map(c=>`<th class="bc-h2">${esc(c.label)}<br><small>${cap(c.key)}종</small></th>`)).join('')}</tr>`;
}
function bBindCustomerResizer(){const handle=document.querySelector('#bcThead .col-resizer');if(!handle)return;handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();handle.setPointerCapture?.(e.pointerId);const startX=e.clientX,startWidth=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bc-cust-col-width'))||230;handle.classList.add('dragging');document.body.classList.add('resizing-column');const move=ev=>{const next=Math.max(110,Math.min(320,startWidth+ev.clientX-startX));document.documentElement.style.setProperty('--bc-cust-col-width',`${Math.round(next)}px`)};const up=()=>{handle.classList.remove('dragging');document.body.classList.remove('resizing-column');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up)};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',up)}}
function bSyncHeaderSticky(){
  requestAnimationFrame(()=>{
    const rows=$('bcThead').querySelectorAll('tr');
    if(rows.length<2){rows[0]?.querySelectorAll('th').forEach(th=>th.style.top='0px');return;}
    const h=Math.ceil(rows[0].getBoundingClientRect().height)-1;
    rows[0].querySelectorAll('th').forEach(th=>th.style.top='0px');
    rows[1].querySelectorAll('th').forEach(th=>th.style.top=h+'px');
  });
}
let bcPage=1, bcPageSize=20, bcExpanded=true;
function renderCustomersPane(){
  const cs=cats(),ind=$('bcInd').value,t=$('bcTier').value,q=$('bcSearch').value.trim().toLowerCase();
  const max={};cs.forEach(c=>max[c]=Math.max(1,...bAggCache.map(a=>a.data[c].sales)));
  let all=bAggCache.filter(a=>(!ind||a.industry===ind)&&(!t||a.tier===t)&&(!q||a.name.toLowerCase().includes(q)))
    .sort((a,b)=>industryRank(a.industry)-industryRank(b.industry)||(bMode==='service'?b.usedTotal-a.usedTotal:b.salesTotal-a.salesTotal)||a.name.localeCompare(b.name,'ko'));
  const industryCounts={};all.forEach(a=>{industryCounts[a.industry]=(industryCounts[a.industry]||0)+1;});
  const pages=Math.max(1,Math.ceil(all.length/bcPageSize));
  bcPage=Math.min(bcPage,pages);
  const list=bcExpanded?all:all.slice((bcPage-1)*bcPageSize,bcPage*bcPageSize);
  $('bcThead').innerHTML=bHeadHtml(cs);
  bBindCustomerResizer();
  bSyncHeaderSticky();
  let last='';
  $('bcTbody').innerHTML=list.map(r=>{
    let g='';if(last!==r.industry){last=r.industry;g=`<tr class="group"><td colspan="${cs.length+2}">${esc(last)}(${industryCounts[last]})</td></tr>`;}
    const cells=cs.map(c=>{const d=r.data[c],v=bMode==='service'?d.used:d.sales;
      if(v===0)return '<td><div class="cell empty"></div></td>';
      const ratio=bMode==='service'?d.used/Math.max(1,d.cap):d.sales/max[c],a=Math.min(.28+ratio*1.1,.98);
      const txt=bMode==='service'?`${d.used}/${d.cap}`:fmt(d.sales);
      return `<td><div class="cell" data-id="${esc(r.id)}" style="background:rgba(155,9,80,${a});color:${a>.45?'#fff':'#9b0950'}">${txt}</div></td>`;}).join('');
    return g+`<tr><td class="cust" data-id="${esc(r.id)}"><span>${esc(r.name)}</span><span class="${tierClass(r.tier)}">${esc(r.tier)}</span></td>${cells}<td class="total">${bMode==='service'?r.usedTotal+'종':fmt(r.salesTotal)}</td></tr>`;
  }).join('');
  $('bcTbody').querySelectorAll('[data-id]').forEach(e=>e.onclick=()=>bShowDetail(e.dataset.id));
  $('bcPage').textContent=`${bcPage} / ${pages}`;
  $('bcPrev').disabled=bcPage===1;$('bcNext').disabled=bcPage===pages;
  $('bcPager').classList.toggle('hidden',bcExpanded);
  $('bcExpandBtn').classList.toggle('active',bcExpanded);
  $('bcExpandIcon').textContent=bcExpanded?'▲':'▼';
  $('bcExpandText').textContent=bcExpanded?'접기':'전체 펼치기';
  $('bcHint').textContent=`${all.length}개사 중 ${list.length}개 표시 · 셀=선택 기간 ${bMode==='service'?'사용 서비스수(사용/보유가능)':'매출(억원)'} · 빗금=미사용 · 고객 클릭 시 상세.`;
}

/* ── 고객 상세 (기회매출·기간라벨) ── */
const bRecExpanded=new Set(); // 추천 상품 클릭 시 펼쳐지는 "쓰는 고객사 목록" 상태(상품코드 키)
function bShowDetail(id){
  if(!id)return;bCurrentId=id;bRefresh();bRecExpanded.clear();const r=agg(id);
  $('bdName').textContent=r.name;$('bdTier').textContent=r.tier;$('bdTier').className=tierClass(r.tier);$('bdIndustry').textContent=r.industry;$('bdPeriod').textContent=bYearLabel();
  const keys=[].concat(...majors().map(m=>m.children.map(c=>c.key)));
  const recoTotal=keys.reduce((s,c)=>s+recommended(c,r).length,0);
  $('bdUsed').textContent=`${r.usedTotal}종 / ${r.capTotal}종`;$('bdUnused').textContent=`${r.capTotal-r.usedTotal}종`;
  $('bdReco').textContent=`${recoTotal}종`;$('bdSales').textContent=fmt(r.salesTotal)+'억원';$('bdRecoBase').textContent=customers.length;
  renderBBlocks(r);
  bShow('bDetail');
}
function bShowIndustry(){
  $('biView').innerHTML=bRenderIndustryView(bCurrentId);
  bShow('bIndustryResult');
}
function renderBBlocks(r){
  $('bBlocks').innerHTML=majors().map(m=>`<div class="ax-major"><h2>${esc(m.name)}</h2>${m.children.map(c=>bBlock(c.key,r)).join('')}</div>`).join('');
  $('bBlocks').onclick=e=>{
    const chip=e.target.closest('.chip');
    if(chip){bShowDetail(chip.dataset.id);return;}
    const row=e.target.closest('.rec-row');
    if(!row)return;
    const code=row.dataset.code;
    bRecExpanded.has(code)?bRecExpanded.delete(code):bRecExpanded.add(code);
    renderBBlocks(r);
  };
}
function bBlock(c,r){
  const d=r.data[c],rec=recommended(c,r);
  const usedHtml=d.items.length?d.items.map(x=>`<div class="row"><span>${esc(x.name)} <small>${esc(x.code)}</small></span><span>${fmt(x.sales)}억원</span></div>`).join(''):'<div class="row">없음</div>';
  const recHtml=rec.length?rec.map(x=>{const avgv=x.peerCount?x.peerSales/x.peerCount:0,open=bRecExpanded.has(x.code);
    const peersHtml=open?`<div class="rec-detail">${x.peers.map(p=>`<span class="chip" data-id="${esc(p.id)}">${esc(p.name)} <small>${fmt(p.sales)}억</small></span>`).join('')}</div>`:'';
    return `<div class="row rec-row" data-code="${esc(x.code)}"><span>${esc(x.name)} <small>${esc(x.code)}</small></span><span style="display:flex;align-items:center;gap:6px"><span class="recommend-meta">${x.priority}순위 · ${x.source==='cross'?'타업종':'동종'} ${x.peerCount}개사 · 평균 ${fmt(avgv)}억</span><span class="recommend-badge">기회</span><span class="cov-flag">${open?'▲':'▼'}</span></span>${peersHtml}</div>`;}).join(''):'<div class="row"><span>추천 가능한 미사용 상품 없음</span></div>';
  return `<div class="block"><h3>${esc(catLabel(c))} <small>${d.used}/${d.cap}종 사용</small></h3><div class="grid">
    <div class="box"><div class="box-head">사용 중 상품</div>${usedHtml}</div>
    <div class="box recommend-box"><div class="box-head recommend-head"><span>추천상품</span></div>${recHtml}</div></div></div>`;
}

/* ── 동종 비교 ── */
function bSelectPeers(){
  bRefresh();const r=agg(bCurrentId),peers=customers.filter(x=>x.industry===r.industry);
  $('bChecks').innerHTML=peers.map(x=>{const a=agg(x.id);
    return `<label class="check"><input type="checkbox" value="${esc(x.id)}" ${x.id===bCurrentId?'checked':''}><span>${esc(x.name)}</span><span>${a.usedTotal}종 · ${fmt(a.salesTotal)}억원</span></label>`;}).join('');
  bShow('bSelect');
}
function bRenderMatrix(ids){
  bRefresh();const rs=ids.map(id=>agg(id)),n=rs.length;$('brPeriod').textContent=bYearLabel();
  let body='',commonTotal=0,partialTotal=0;
  cats().forEach(c=>{
    const uni=new Map();rs.forEach(r=>r.data[c].items.forEach(x=>{if(!uni.has(x.code))uni.set(x.code,x.name);}));
    if(!uni.size)return;
    const rows=[...uni.entries()].map(([code,name])=>({code,name,owners:rs.filter(r=>r.data[c].items.some(x=>x.code===code)).length}));
    const common=rows.filter(x=>x.owners===n), partial=rows.filter(x=>x.owners<n);
    commonTotal+=common.length;partialTotal+=partial.length;
    const rowHtml=(x,cls)=>{const cells=rs.map(r=>{const it=r.data[c].items.find(y=>y.code===x.code);return `<span class="peer-sales ${it?'own':'miss'}">${it?fmt(it.sales):'미침투'}</span>`;}).join('');
      return `<div class="peer-row ${cls}"><span class="peer-product">${esc(x.name)} <small>${esc(x.code)}</small><span class="mtx-badge ${cls}">${x.owners}/${n}</span></span>${cells}</div>`;};
    const headers=rs.map(r=>`<span class="peer-head ${r.id===bCurrentId?'me':''}">${esc(r.name)}<small>${esc(r.tier)}</small></span>`).join('');
    body+=`<div class="peer-cat"><div class="peer-top"> <h4>${esc(bAxCatLabel(c))}</h4>${headers}</div>${common.map(x=>rowHtml(x,'common')).join('')+partial.map(x=>rowHtml(x,'partial')).join('')}<div class="peer-row peer-subtotal"><span>${esc(bAxCatLabel(c))} 소계</span>${rs.map(r=>`<span>${fmt(r.data[c].sales)}</span>`).join('')}</div></div>`;
  });
  body+=`<div class="peer-row peer-subtotal peer-grand-total"><span>총 매출(억원)</span>${rs.map(r=>`<span>${fmt(r.salesTotal)}</span>`).join('')}</div>`;
  $('brPeerView').innerHTML=`<div class="peer-grid" style="--peer-cols:240px repeat(${n},170px);--peer-width:${240+n*170}px">${body}</div>`;
  $('brSummary').textContent=`선택 고객 ${n}개사 · 공통 보유 상품 ${commonTotal}종 · 차이(일부만 보유) 상품 ${partialTotal}종`;
  bShow('bResult');
}

function bRenderIndustryView(id){
  const target=customers.find(x=>x.id===id), peers=customers.filter(x=>x.industry===target?.industry);
  if(!target||!peers.length)return '';
  const targetAgg=agg(target.id),rs=peers.map(x=>agg(x.id));
  const allAgg=customers.map(x=>agg(x.id));
  const blocks=cats().map(c=>{
    const uni=new Map();RAW.filter(r=>cat(r)===c&&serviceKey(r)).forEach(r=>{const code=serviceKey(r);if(!uni.has(code))uni.set(code,{name:label(r),owners:0});});
    const rows=[...uni.entries()].map(([code,x])=>{
      const owners=rs.filter(r=>r.data[c].items.some(y=>y.code===code)).length;
      const allOwners=allAgg.filter(r=>r.data[c].items.some(y=>y.code===code)).length;
      const owned=targetAgg.data[c].items.some(y=>y.code===code);
      return {code,name:x.name,owners,allOwners,owned};
    }).sort((a,b)=>b.owners-a.owners||a.name.localeCompare(b.name,'ko'));
    if(!rows.length)return '';
    return `<div class="industry-cat"><div class="industry-top"><h4>${esc(bAxCatLabel(c))}</h4><div class="industry-head"><span>전체업종</span><span>업종공통</span><span class="industry-target-head">${esc(target.name)}</span></div></div>${rows.map(x=>`<div class="industry-row"><span class="industry-product">${esc(x.name)} <small>${esc(x.code)}</small></span><span class="industry-stats">${x.allOwners?`<b>${x.allOwners}/${allAgg.length}</b> <small>(${Math.round(x.allOwners/allAgg.length*100)}%)</small>`:'<span class="industry-missing">미침투</span>'}</span><span class="industry-stats industry-stats-common">${x.owners?`<b>${x.owners}/${rs.length}</b> <small>(${Math.round(x.owners/rs.length*100)}%)</small>`:'<span class="industry-missing">미침투</span>'}</span><span class="industry-stats">${x.owned?'<span class="industry-owned">침투</span>':'<span class="industry-missing">미침투</span>'}</span></div>`).join('')}</div>`;
  }).join('');
  return `<div class="industry-view scroll-hint"><h3>${esc(target.industry)} 업종 상품 현황</h3><div class="industry-meta">업종 고객 ${rs.length}개사 · 기준 고객 ${esc(target.name)}</div><div class="industry-note">전체업종은 Key Account 전체 ${allAgg.length}개사, 업종공통은 해당 상품을 보유한 업종 고객 수입니다. 이 화면에서는 업종 내 아무도 보유하지 않은 상품도 함께 표시합니다.</div>${blocks}</div>`;
}

/* ── 이벤트 ── */
function bSeg(segId,attr,setter){$(segId).querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
  $(segId).querySelectorAll('button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');setter(btn.dataset[attr]);renderHome();});}
bSeg('bYear','y',y=>bYear=y);
bSeg('bGran','g',g=>{bGran=g;bOpenNodes.clear();});
bSeg('bSort','s',s=>bSort=s);
bSeg('bMode','m',m=>bMode=m);
$('bNav').querySelectorAll('button[data-p]').forEach(btn=>btn.onclick=()=>{
  $('bNav').querySelectorAll('button[data-p]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  bPane=btn.dataset.p;$('bOverviewPane').hidden=bPane!=='ov';$('bCustomersPane').hidden=bPane!=='cust';renderHome();});
$('bcInd').onchange=$('bcTier').onchange=$('bcSearch').oninput=()=>{bcPage=1;renderCustomersPane();};
$('bcSize').onchange=e=>{bcPageSize=Number(e.target.value);bcPage=1;renderCustomersPane();};
$('bcExpandBtn').onclick=()=>{bcExpanded=!bcExpanded;if(!bcExpanded)bcPage=1;renderCustomersPane();};
$('bcPrev').onclick=()=>{bcPage--;renderCustomersPane();};
$('bcNext').onclick=()=>{bcPage++;renderCustomersPane();};
$('bBack').onclick=()=>{bShow('bHome');renderHome();};
 $('bCompare').onclick=bShowIndustry;$('bPeerCompare').onclick=bSelectPeers;$('biBack').onclick=()=>bShowDetail(bCurrentId);$('bSelBack').onclick=()=>bShowDetail(bCurrentId);$('bResBack').onclick=bSelectPeers;
$('bGo').onclick=()=>{const ids=[...$('bChecks').querySelectorAll('input:checked')].map(x=>x.value);
  if(ids.length<2||ids.length>4){$('bWarn').style.display='block';return;}$('bWarn').style.display='none';bRenderMatrix(ids);};

/* ── 상품분류체계 팝업(상품체계데이터=TAXO, 매출데이터=RAW와 별도 업로드/관리) ── */
function bTaxonomyRows(){
  const usedNames=[...new Set(RAW.filter(r=>Number(r.sales2025||0)>0||Number(r.sales2026||0)>0).map(r=>r.profitName))];
  const seen=new Set(),rows=[];
  TAXO.forEach(r=>{
    const key=[r.axMajor,r.axMiddle,r.major,r.middle,r.profitName,r.salesName].join('|||');
    if(seen.has(key))return;
    seen.add(key);
    rows.push({...r,used:usedNames.some(n=>taxSimilar(n,r.profitName))});
  });
  return rows.sort((a,b)=>
    a.axMajor.localeCompare(b.axMajor,'ko')||a.axMiddle.localeCompare(b.axMiddle,'ko')||
    a.major.localeCompare(b.major,'ko')||a.middle.localeCompare(b.middle,'ko')||
    a.profitName.localeCompare(b.profitName,'ko')||a.salesName.localeCompare(b.salesName,'ko'));
}
function bRenderTaxonomy(){
  const rows=bTaxonomyRows();
  const uniq=f=>new Set(rows.map(f)).size,usedCount=rows.filter(r=>r.used).length;
  $('bTaxThead').innerHTML=`<tr><th class="tax-key">AX구분(대)</th><th>AX구분(중)</th><th>대분류</th><th>소분류</th><th>손익명<br><small class="tax-count">(${uniq(r=>r.profitName)}종)</small></th><th>고객소통명<br><small class="tax-count">(${uniq(r=>r.salesName)}종)</small></th><th class="tax-used">KA여부<br><small class="tax-count">(${usedCount}건)</small></th></tr>`;
  $('bTaxBody').innerHTML=rows.map(r=>
    `<tr><td class="tax-key">${esc(r.axMajor)}</td><td>${esc(r.axMiddle)}</td><td>${esc(r.major)}</td><td>${esc(r.middle)}</td><td>${esc(r.profitName)}</td><td>${esc(r.salesName)}</td><td class="tax-used">${r.used?'<span class="tax-mark on">✓</span>':'<span class="tax-mark off"></span>'}</td></tr>`
  ).join('');
}
$('bTaxonomyBtn').onclick=()=>{bRenderTaxonomy();$('bTaxModal').classList.remove('hidden');};
$('bTaxClose').onclick=()=>$('bTaxModal').classList.add('hidden');
$('bTaxModal').addEventListener('mousedown',e=>{if(e.target.id==='bTaxModal')$('bTaxModal').dataset.downOnOverlay='1';else delete $('bTaxModal').dataset.downOnOverlay;});
$('bTaxModal').addEventListener('click',e=>{if(e.target.id==='bTaxModal'&&$('bTaxModal').dataset.downOnOverlay==='1')$('bTaxModal').classList.add('hidden');});

/* ── CSV 업로드(매출데이터/상품체계 중 선택) ── */
function bShowUploadDone(label){
  $('bUploadDoneMsg').innerHTML=`${esc(label)} 업로드 완료되었습니다.<br>우측 상단의 '파일로 저장' 버튼으로 다운받아 사용바랍니다.`;
  $('bUploadDoneModal').classList.remove('hidden');
}
$('bUploadBtn').onclick=()=>$('bUploadChooseModal').classList.remove('hidden');
$('bUploadChooseClose').onclick=()=>$('bUploadChooseModal').classList.add('hidden');
$('bUploadChooseModal').addEventListener('mousedown',e=>{if(e.target.id==='bUploadChooseModal')$('bUploadChooseModal').dataset.downOnOverlay='1';else delete $('bUploadChooseModal').dataset.downOnOverlay;});
$('bUploadChooseModal').addEventListener('click',e=>{if(e.target.id==='bUploadChooseModal'&&$('bUploadChooseModal').dataset.downOnOverlay==='1')$('bUploadChooseModal').classList.add('hidden');});
$('bUploadSalesBtn').onclick=()=>{$('bUploadChooseModal').classList.add('hidden');$('bFile').click();};
$('bUploadTaxoBtn').onclick=()=>{$('bUploadChooseModal').classList.add('hidden');$('bFileTaxo').click();};
$('bFile').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  $('bStatus').textContent='매출 데이터 읽는 중...';
  try{
    RAW=await parse(f);
    try{localStorage.setItem(LS_KEY,JSON.stringify(RAW));}catch(e){}
    dims();
    bOpenNodes.clear();bExpanded.clear();bcPage=1;bcExpanded=true;
    bFillFilters();
    $('bStatus').textContent=`${f.name} · ${customers.length}개 고객 적용`;
    renderHome();
    bShowUploadDone('매출 데이터');
  }catch(err){alert(err.message);$('bStatus').textContent='매출 데이터 업로드 실패';}
  e.target.value='';
};
$('bFileTaxo').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  $('bStatus').textContent='상품체계 데이터 읽는 중...';
  try{
    TAXO=await parseTaxo(f);
    try{localStorage.setItem(LS_KEY_TAXO,JSON.stringify(TAXO));}catch(e){}
    $('bStatus').textContent=`${f.name} · 상품체계 ${TAXO.length}건 적용`;
    bShowUploadDone('상품체계 데이터');
  }catch(err){alert(err.message);$('bStatus').textContent='상품체계 데이터 업로드 실패';}
  e.target.value='';
};
$('bUploadDoneClose').onclick=()=>$('bUploadDoneModal').classList.add('hidden');
$('bUploadDoneModal').addEventListener('mousedown',e=>{if(e.target.id==='bUploadDoneModal')$('bUploadDoneModal').dataset.downOnOverlay='1';else delete $('bUploadDoneModal').dataset.downOnOverlay;});
$('bUploadDoneModal').addEventListener('click',e=>{if(e.target.id==='bUploadDoneModal'&&$('bUploadDoneModal').dataset.downOnOverlay==='1')$('bUploadDoneModal').classList.add('hidden');});
$('bSaveFileBtn').onclick=()=>{
  const html=document.documentElement.outerHTML;
  let out=html.replace(/let RAW=\[[\s\S]*?\];/,'let RAW='+JSON.stringify(RAW)+';');
  out=out.replace(/let TAXO=\[[\s\S]*?\];/,'let TAXO='+JSON.stringify(TAXO)+';');
  const blob=new Blob(['<!doctype html>\n'+out],{type:'text/html'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(document.title||'mockup').replace(/[\\/:*?"<>|]/g,'').trim()+'.html';
  a.click();
  URL.revokeObjectURL(a.href);
};

/* ── 필터 채우기 ── */
function bFillFilters(){
  $('bcInd').innerHTML='<option value="">전체 업종</option>'+industries.map(x=>`<option>${esc(x)}</option>`).join('');
  $('bcTier').innerHTML='<option value="">전체 Tier</option>'+tiers.map(x=>`<option>${esc(x)}</option>`).join('');
}
let bRestored=false;
try{
  const saved=localStorage.getItem(LS_KEY);
  if(saved){RAW=JSON.parse(saved);bRestored=true;}
}catch(e){}
try{
  const savedTaxo=localStorage.getItem(LS_KEY_TAXO);
  if(savedTaxo)TAXO=JSON.parse(savedTaxo);
}catch(e){}
dims();bFillFilters();renderHome();   // 초기 랜딩 (dims: RAW→customers/industries/tiers 세팅)
if(bRestored)$('bStatus').textContent=`저장된 데이터 · ${customers.length}개 고객 적용`;
