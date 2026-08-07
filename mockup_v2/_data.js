/* 공용 합성 데이터 + 집계 (build.mjs의 CATALOG/INDUSTRIES/시드 RNG를 그대로 재현 — mockup.html과 동일 숫자) */
const rng=s=>{let x=s>>>0;return()=>(x=(x*1664525+1013904223)>>>0)/2**32};
const CATALOG=[
 {s:'S01',ai:'NW Infra',axM:'Legacy',axm:'Infra',pg:'P01',mj:'대분류1',pop:.92,scale:2.2e9},
 {s:'S02',ai:'NW Infra',axM:'Legacy',axm:'Infra',pg:'P02',mj:'대분류1',pop:.85,scale:1.4e9},
 {s:'S03',ai:'NW Infra',axM:'Legacy',axm:'Infra',pg:'P03',mj:'대분류1',pop:.7,scale:8e8},
 {s:'S04',ai:'NW Infra',axM:'Legacy',axm:'Infra',pg:'P04',mj:'대분류2',pop:.55,scale:6e8},
 {s:'S05',ai:'NW Infra',axM:'Legacy',axm:'Infra',pg:'P05',mj:'대분류2',pop:.38,scale:3e8},
 {s:'S06',ai:'NW Infra',axM:'Legacy',axm:'Infra',pg:'P06',mj:'대분류2',pop:.28,scale:2e8},
 {s:'S07',ai:'AI Infra',axM:'AX',axm:'Infra',pg:'P07',mj:'대분류3',pop:.72,scale:3.5e9},
 {s:'S08',ai:'AI Infra',axM:'AX',axm:'Infra',pg:'P08',mj:'대분류3',pop:.5,scale:1.8e9},
 {s:'S09',ai:'AI Infra',axM:'AX',axm:'Infra',pg:'P09',mj:'대분류4',pop:.33,scale:9e8},
 {s:'S10',ai:'AI Infra',axM:'AX',axm:'Infra',pg:'P10',mj:'대분류4',pop:.22,scale:1.2e9},
 {s:'S11',ai:'AI Infra',axM:'AX',axm:'Infra',pg:'P11',mj:'대분류4',pop:.15,scale:7e8},
 {s:'S12',ai:'AI Platform',axM:'AX',axm:'Infra',pg:'P12',mj:'대분류5',pop:.58,scale:1.1e9},
 {s:'S13',ai:'AI Platform',axM:'AX',axm:'Infra',pg:'P13',mj:'대분류5',pop:.4,scale:6e8},
 {s:'S14',ai:'AI Platform',axM:'AX',axm:'Infra',pg:'P14',mj:'대분류6',pop:.3,scale:5e8},
 {s:'S15',ai:'AI Platform',axM:'AX',axm:'Infra',pg:'P15',mj:'대분류6',pop:.18,scale:4e8},
 {s:'S16',ai:'AI Platform',axM:'AX',axm:'Infra',pg:'P16',mj:'대분류6',pop:.12,scale:3e8},
 {s:'S17',ai:'AI Model',axM:'AX',axm:'Application',pg:'P17',mj:'대분류7',pop:.42,scale:1.6e9},
 {s:'S18',ai:'AI Model',axM:'AX',axm:'Application',pg:'P18',mj:'대분류7',pop:.26,scale:9e8},
 {s:'S19',ai:'AI Model',axM:'AX',axm:'Application',pg:'P19',mj:'대분류8',pop:.16,scale:7e8},
 {s:'S20',ai:'AI Model',axM:'AX',axm:'Application',pg:'P20',mj:'대분류8',pop:.1,scale:1.4e9},
 {s:'S21',ai:'AI Model',axM:'AX',axm:'Application',pg:'P21',mj:'대분류8',pop:.08,scale:1.1e9},
 {s:'S22',ai:'Application',axM:'Legacy',axm:'Application',pg:'P22',mj:'대분류9',pop:.8,scale:5e8},
 {s:'S23',ai:'Application',axM:'Legacy',axm:'Application',pg:'P23',mj:'대분류9',pop:.62,scale:4e8},
 {s:'S24',ai:'Application',axM:'AX',axm:'Application',pg:'P24',mj:'대분류9',pop:.45,scale:7e8},
 {s:'S25',ai:'Application',axM:'AX',axm:'Application',pg:'P25',mj:'대분류10',pop:.3,scale:6e8},
 {s:'S26',ai:'Application',axM:'AX',axm:'Application',pg:'P26',mj:'대분류10',pop:.2,scale:5e8},
 {s:'S27',ai:'Application',axM:'AX',axm:'Application',pg:'P27',mj:'대분류10',pop:.13,scale:4e8},
];
const INDUSTRY_ORDER=['금융','대기업','온라인/IT','글로벌','공공','SME'];
const INDUSTRIES=[{name:'금융',n:9},{name:'대기업',n:9},{name:'온라인/IT',n:9},{name:'글로벌',n:9},{name:'공공',n:9},{name:'SME',n:8}];
const sName=c=>'세부상품'+c.s.slice(1);

const CUSTOMERS=[];
{let idx=0;for(const ind of INDUSTRIES)for(let k=0;k<ind.n;k++){idx++;const r=rng(1000+idx*7);
  const tier=r()<.18?'Tier1':r()<.72?'Tier2':'Tier3';
  CUSTOMERS.push({idx,id:'C'+String(idx).padStart(2,'0'),name:'고객'+String(idx).padStart(2,'0'),tier,industry:ind.name});}
 const t1=CUSTOMERS.filter(c=>c.tier==='Tier1').length;
 if(t1<5){const rest=CUSTOMERS.filter(c=>c.tier!=='Tier1');for(let i=0;i<5-t1&&i<rest.length;i++)rest[i].tier='Tier1';}}

const SIZE={Tier1:3.0,Tier2:1.4,Tier3:.6};
const RAW=[];
for(const c of CUSTOMERS){const r=rng(9000+c.idx*13),rows=[];
 const mk=p=>({custId:c.id,name:c.name,tier:c.tier,industry:c.industry,salesCode:p.s,salesName:sName(p),
   sales2025:0,sales2026:0,axMajor:p.axM,axMiddle:p.axm});
 for(const p of CATALOG){let pop=p.pop;
  if(c.industry==='금융'&&(p.ai==='AI Platform'||p.ai==='AI Model'))pop=Math.min(.95,pop+.12);
  if(c.industry==='대기업'&&p.ai==='NW Infra')pop=Math.min(.95,pop+.08);
  if(c.industry==='글로벌'&&p.ai==='Application')pop=Math.min(.95,pop+.1);
  if(r()>pop)continue;
  const annual=Math.round(p.scale*SIZE[c.tier]*(.5+r()*1.1)),born26=r()<.06,churn=r()<.08;
  const s25=born26?0:Math.round(annual*(.85+r()*.35)),s26=churn?0:Math.round(annual*(.35+r()*.22));
  if(!s25&&!s26)continue;
  const row=mk(p);row.sales2025=s25;row.sales2026=s26;rows.push(row);}
 if(rows.length<4)for(const p of [...CATALOG].sort((a,b)=>b.pop-a.pop)){
  if(rows.find(x=>x.salesCode===p.s))continue;
  const base=p.scale*SIZE[c.tier],row=mk(p);row.sales2025=Math.round(base);row.sales2026=Math.round(base*.45);rows.push(row);
  if(rows.length>=4)break;}
 RAW.push(...rows);}

/* ── 공용 유틸 ── */
let YEAR='2026';
const salesField=()=>YEAR==='2026'?'sales2026':'sales2025';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>(Number(n||0)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1});
const fmt0=n=>Math.round(Number(n||0)/1e8).toLocaleString('ko-KR');
const AXKEYS=['AX|||Infra','AX|||Application','Legacy|||Infra','Legacy|||Application'];
const axLabel=k=>k.split('|||')[1];
const axMajors=()=>[{name:'AX',children:['AX|||Infra','AX|||Application']},{name:'Legacy',children:['Legacy|||Infra','Legacy|||Application']}];
const indRank=i=>{const x=INDUSTRY_ORDER.indexOf(i);return x<0?99:x};
const heat=r=>Math.min(.28+r*1.1,.98);

/* 당사 전체 상품 카탈로그 수.
   주의(목업 가정): 합성 매출데이터에는 27종이 전부 등장하므로 이대로면 "카탈로그 중 KA 사용"이 27/27=100%가 돼
   첫 화면의 핵심 KPI가 의미를 잃는다. 실 환경에서는 상품 카탈로그가 KA 청구 상품보다 넓으므로,
   시안 검토용으로 카탈로그 총수를 아래처럼 별도 상수로 둔다. 실 데이터 연결 시 상품체계 기준 실제 종수로 교체.
   CATALOG_EXTRA_BY_AX = KA가 아무도 쓰지 않는(=화이트스페이스) 상품 종수 가정. */
const CATALOG_EXTRA_BY_AX={'AX|||Infra':4,'AX|||Application':5,'Legacy|||Infra':1,'Legacy|||Application':2};
const capByAx={};AXKEYS.forEach(k=>capByAx[k]=CATALOG.filter(p=>p.axM+'|||'+p.axm===k).length+CATALOG_EXTRA_BY_AX[k]);
const CATALOG_TOTAL=AXKEYS.reduce((s,k)=>s+capByAx[k],0);

/* 고객별 집계: {id,name,industry,usedTotal,salesTotal,data:{axKey:{used,cap,sales,codes:Set}}} */
function aggAll(){
 const f=salesField(),m=new Map();
 CUSTOMERS.forEach(c=>{const d={};AXKEYS.forEach(k=>d[k]={used:0,cap:capByAx[k],sales:0,codes:new Set()});
   m.set(c.id,{id:c.id,name:c.name,industry:c.industry,tier:c.tier,usedTotal:0,salesTotal:0,data:d,codes:new Set()})});
 RAW.forEach(r=>{const a=m.get(r.custId),k=r.axMajor+'|||'+r.axMiddle,v=Number(r[f]||0);
   a.data[k].sales+=v;a.salesTotal+=v;
   if(v>0&&!a.data[k].codes.has(r.salesCode)){a.data[k].codes.add(r.salesCode);a.data[k].used++;a.usedTotal++;a.codes.add(r.salesCode)}});
 return [...m.values()];
}
/* 업종별 소계 */
function aggIndustry(rows){
 const m=new Map();
 INDUSTRY_ORDER.forEach(i=>m.set(i,{industry:i,n:0,salesTotal:0,usedSum:0,codes:new Set(),data:{}}));
 AXKEYS.forEach(k=>INDUSTRY_ORDER.forEach(i=>m.get(i).data[k]={used:0,sales:0,owners:0}));
 rows.forEach(a=>{const g=m.get(a.industry);if(!g)return;
   g.n++;g.salesTotal+=a.salesTotal;g.usedSum+=a.usedTotal;a.codes.forEach(c=>g.codes.add(c));
   AXKEYS.forEach(k=>{g.data[k].sales+=a.data[k].sales;g.data[k].used+=a.data[k].used;if(a.data[k].used>0)g.data[k].owners++})});
 return [...m.values()].filter(g=>g.n>0);
}
/* KA 전체 관점 */
function aggTotal(rows){
 const codes=new Set();rows.forEach(a=>a.codes.forEach(c=>codes.add(c)));
 const perAx=AXKEYS.map(k=>{const cs=new Set();let sales=0,owners=0;
   rows.forEach(a=>{sales+=a.data[k].sales;if(a.data[k].used>0){owners++;a.data[k].codes.forEach(c=>cs.add(c))}});
   return {key:k,label:k.replace('|||',' · '),used:cs.size,cap:capByAx[k],sales,owners,n:rows.length}});
 return {n:rows.length,usedCodes:codes.size,catalog:CATALOG_TOTAL,
   salesTotal:rows.reduce((s,a)=>s+a.salesTotal,0),
   avgUsed:rows.reduce((s,a)=>s+a.usedTotal,0)/Math.max(1,rows.length),perAx};
}
