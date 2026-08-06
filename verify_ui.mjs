import fs from 'fs';
let h = fs.readFileSync('mockup.html', 'utf8');
const js = h.slice(h.indexOf('<script>') + 8, h.lastIndexOf('</script>'));
try { new Function(js); console.log('SYNTAX OK'); } catch (e) { console.log('SYNTAX ERR:', e.message); process.exit(1); }

const probe = `<div id="__t"></div><script>
(function(){const L=[],ok=(k,v)=>L.push(k+": "+v);try{
  ok("tabB_wrap_exists",!!document.getElementById("tabB-wrap"));
  document.querySelector("#bNav button[data-p='cust']").click();
  ok("cust_pane_visible",!document.getElementById("bCustomersPane").hidden);
  ok("mode_labels",[...document.querySelectorAll("#bMode button")].map(b=>b.textContent).join(","));
  document.querySelector("#bMode button[data-m='sales']").click();
  ok("bMode_now",bMode);
  document.querySelector("#bMode button[data-m='service']").click();
  ok("initial_expand_text",document.getElementById("bcExpandText").textContent);
  ok("initial_pager_hidden",document.getElementById("bcPager").classList.contains("hidden"));
  ok("initial_rows_all",document.querySelectorAll("#bcTbody td.cust").length);
  document.getElementById("bcExpandBtn").click(); // 기본값(펼침) → 접기
  ok("expand_text_after_collapse",document.getElementById("bcExpandText").textContent);
  ok("pager_visible_after_collapse",!document.getElementById("bcPager").classList.contains("hidden"));
  ok("size_options",[...document.querySelectorAll("#bcSize option")].map(o=>o.value).join(","));
  document.getElementById("bcSize").value="10";document.getElementById("bcSize").dispatchEvent(new Event("change"));
  ok("rows_after_size10",document.querySelectorAll("#bcTbody td.cust").length);
  ok("page_indicator",document.getElementById("bcPage").textContent);
  document.getElementById("bcNext").click();
  ok("page_after_next",document.getElementById("bcPage").textContent);
  ok("rows_page2",document.querySelectorAll("#bcTbody td.cust").length);
  document.getElementById("bcExpandBtn").click(); // 접기 → 펼침
  ok("expand_text",document.getElementById("bcExpandText").textContent);
  ok("rows_all",document.querySelectorAll("#bcTbody td.cust").length);
  ok("pager_hidden",document.getElementById("bcPager").classList.contains("hidden"));
  document.getElementById("bcExpandBtn").click();
  ok("rows_after_collapse",document.querySelectorAll("#bcTbody td.cust").length);
  document.getElementById("bcInd").value = document.getElementById("bcInd").options[1]?.value || "";
  document.getElementById("bcInd").dispatchEvent(new Event("change"));
  ok("filtered_rows_industry",document.querySelectorAll("#bcTbody td.cust").length);
  ok("page_reset_after_filter",document.getElementById("bcPage").textContent);
  document.getElementById("bcInd").value="";document.getElementById("bcInd").dispatchEvent(new Event("change"));
  ok("upload_btn_exists",!!document.getElementById("bUploadBtn"));
  ok("file_input_exists",!!document.getElementById("bFile"));
  ok("parse_is_function",typeof parse === "function");
  ok("pivotTaxo_is_function",typeof pivotTaxo === "function");
  ok("dims_is_function",typeof dims === "function");
  let fileClicked=false; document.getElementById("bFile").click=()=>{fileClicked=true;};
  document.getElementById("bUploadBtn").onclick();
  ok("upload_click_triggers_file_click",fileClicked);
  // 기존 기능 회귀 확인 (개요 드릴다운, 상세)
  document.querySelector("#bNav button[data-p='ov']").click();
  document.querySelector("#bGran button[data-g='cat']").click();
  ok("overview_cat_rows",document.querySelectorAll("#bCovList .cov-row").length);
  document.querySelector("#bCovList .cov-row").click();
  ok("drill_major_rows",document.querySelectorAll("#bCovList .cov-row").length);
  document.querySelector(".crumb-link")?.click();
  document.querySelector("#bNav button[data-p='cust']").click();
  document.querySelector("#bcTbody td.cust")?.click();
  ok("detail_shown",!document.getElementById("bDetail").classList.contains("hidden"));
  document.getElementById("bBack").click();
}catch(e){L.push("EXC: "+e.message+" | "+e.stack)}
document.getElementById("__t").textContent=JSON.stringify(L);
})();
</` + `script>`;
h = h.replace('</body>', probe + '</body>');
fs.writeFileSync('/tmp/verify_out.html', h);
console.log('probe written to /tmp/verify_out.html');
