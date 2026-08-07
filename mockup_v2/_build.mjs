import fs from 'fs';
const R = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
const head = R('_head.css'), data = R('_data.js');
const TITLES = { a: 'A — KPI 카드 + 업종 소계 표', b: 'B — 도넛/바 차트 + 업종 카드 그리드', c: 'C — 단일 캔버스 인라인 드릴다운' };

for (const k of process.argv.slice(2)) {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>메뉴판 v2 시안 ${TITLES[k]}</title>
<style>
${head}
${R(`_${k}.css`)}
</style></head><body>
${R(`_${k}.body.html`)}
<script>
${data}
${R(`_${k}.js`)}
</script></body></html>`;
  const out = new URL(`mockup_v2_option-${k}.html`, import.meta.url);
  fs.writeFileSync(out, html);
  console.log('wrote', out.pathname, html.length, 'bytes');
}
