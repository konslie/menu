import fs from 'fs';
let h = fs.readFileSync('mockup.html', 'utf8');

const probe = `<div id="__t"></div><script>
(function(){const L=[],ok=(k,v)=>L.push(k+": "+v);try{
  ok("tax_btn_exists",!!document.getElementById("bTaxonomyBtn"));
  ok("modal_hidden_initially",document.getElementById("bTaxModal").classList.contains("hidden"));
  document.getElementById("bTaxonomyBtn").click();
  ok("modal_visible_after_click",!document.getElementById("bTaxModal").classList.contains("hidden"));
  const rows=document.querySelectorAll("#bTaxBody tr");
  ok("row_count",rows.length);
  ok("first_row_html",rows[0]?rows[0].innerHTML.slice(0,300):"NONE");
  ok("col_count_th",document.querySelectorAll("table.tax thead th").length);
  ok("thead_th_position",getComputedStyle(document.querySelector("table.tax th")).position);
  ok("tax_key_th_count",document.querySelectorAll("table.tax th.tax-key").length);
  ok("tax_key_td_count",document.querySelectorAll("table.tax td.tax-key").length);
  ok("modal_head_position_not_static",getComputedStyle(document.querySelector(".modal-head")).display);
  ok("modal_body_overflow",getComputedStyle(document.querySelector(".modal-body")).overflow);
  const uniq=new Set([...rows].map(r=>r.innerHTML));
  ok("all_rows_unique",uniq.size===rows.length);
  document.getElementById("bTaxClose").click();
  ok("modal_hidden_after_close",document.getElementById("bTaxModal").classList.contains("hidden"));
  document.getElementById("bTaxonomyBtn").click();
  document.getElementById("bTaxModal").click();
  ok("modal_hidden_after_overlay_click",document.getElementById("bTaxModal").classList.contains("hidden"));
  ok("upload_btn_still_exists",!!document.getElementById("bUploadBtn"));
}catch(e){L.push("EXC: "+e.message+" | "+e.stack)}
document.getElementById("__t").textContent=JSON.stringify(L);
})();
</` + `script>`;
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync('/tmp/verify_tax_out.html', h);
console.log('probe written to /tmp/verify_tax_out.html');
