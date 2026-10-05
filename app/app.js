/* Service Request Tracker — vanilla JS, localStorage persistence.
 * No backend, no dependencies. Open app/index.html in a browser. */
(function () {
  "use strict";
  var KEY = "srt-requests-v1";
  var STATUSES = ["Open", "In progress", "Resolved", "Closed"];

  function seed() {
    return [
      { id: "REQ-1001", title: "Printer not scanning to email", requester: "A. Mwangi",
        category: "IT support", priority: "Medium", status: "Open",
        desc: "Scan-to-email fails with auth error since Monday.", notes: [], created: "2026-09-28" },
      { id: "REQ-1002", title: "Odoo: duplicate UoM on sales orders", requester: "B. Otieno",
        category: "ERP", priority: "High", status: "In progress",
        desc: "Units mismatch between quotation and delivery slip.", notes: ["Reproduced on test company."], created: "2026-09-30" },
      { id: "REQ-1003", title: "Warehouse AP slow after 4pm", requester: "C. Njeri",
        category: "Network", priority: "High", status: "Open",
        desc: "Latency spikes on the warehouse access point in the evenings.", notes: [], created: "2026-10-02" }
    ];
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted storage -> reseed */ }
    var s = seed();
    save(s);
    return s;
  }
  function save(r) { localStorage.setItem(KEY, JSON.stringify(r)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var reqs = load();
  var list = document.getElementById("list");
  var q = document.getElementById("q");
  var fStatus = document.getElementById("f-status");
  var fPrio = document.getElementById("f-prio");

  function dashboard() {
    var open = 0, prog = 0, res = 0, high = 0;
    reqs.forEach(function (r) {
      if (r.status === "Open") open++;
      if (r.status === "In progress") prog++;
      if (r.status === "Resolved") res++;
      if ((r.priority === "High" || r.priority === "Urgent") && r.status !== "Closed" && r.status !== "Resolved") high++;
    });
    document.getElementById("c-open").textContent = open;
    document.getElementById("c-prog").textContent = prog;
    document.getElementById("c-res").textContent = res;
    document.getElementById("c-high").textContent = high;
  }

  function filtered() {
    var term = q.value.trim().toLowerCase();
    return reqs.filter(function (r) {
      if (fStatus.value && r.status !== fStatus.value) return false;
      if (fPrio.value && r.priority !== fPrio.value) return false;
      if (term && (r.title + " " + r.requester + " " + r.desc + " " + r.id).toLowerCase().indexOf(term) < 0) return false;
      return true;
    });
  }

  function render() {
    dashboard();
    var html = "";
    filtered().forEach(function (r) {
      html += '<li><strong>' + esc(r.id) + ' · ' + esc(r.title) + '</strong>'
        + '<div class="meta"><span class="badge st-' + esc(r.status) + '">' + esc(r.status) + '</span>'
        + '<span class="badge">' + esc(r.priority) + '</span><span>' + esc(r.requester) + '</span>'
        + '<span>' + esc(r.category) + '</span><span>' + esc(r.created) + '</span></div>'
        + '<p>' + esc(r.desc) + '</p>'
        + r.notes.map(function (n) { return '<div class="note">' + esc(n) + '</div>'; }).join("")
        + '<div class="row"><select data-act="status" data-id="' + esc(r.id) + '">'
        + STATUSES.map(function (s) { return '<option' + (s === r.status ? " selected" : "") + ">" + s + "</option>"; }).join("")
        + '</select><input data-act="note" data-id="' + esc(r.id) + '" placeholder="Add note…" maxlength="280">'
        + '<button class="ghost" data-act="addnote" data-id="' + esc(r.id) + '">Add</button></div></li>';
    });
    list.innerHTML = html || "<li>No requests match the filters.</li>";
  }

  list.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act='addnote']");
    if (!b) return;
    var id = b.getAttribute("data-id");
    var inp = list.querySelector("input[data-id='" + id + "']");
    var v = inp.value.trim();
    if (!v) return;
    reqs.forEach(function (r) { if (r.id === id) r.notes.push(v); });
    save(reqs); render();
  });
  list.addEventListener("change", function (e) {
    var s = e.target.closest("[data-act='status']");
    if (!s) return;
    var id = s.getAttribute("data-id");
    reqs.forEach(function (r) { if (r.id === id) r.status = s.value; });
    save(reqs); render();
  });

  document.getElementById("f").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = 1000 + reqs.length + 1;
    reqs.unshift({
      id: "REQ-" + n,
      title: document.getElementById("title").value.trim(),
      requester: document.getElementById("requester").value.trim(),
      category: document.getElementById("category").value,
      priority: document.getElementById("priority").value,
      status: "Open", desc: document.getElementById("desc").value.trim(),
      notes: [], created: new Date().toISOString().slice(0, 10)
    });
    save(reqs); e.target.reset(); render();
  });

  document.getElementById("reset").addEventListener("click", function () {
    reqs = seed(); save(reqs); render();
  });
  [q, fStatus, fPrio].forEach(function (el) { el.addEventListener("input", render); });

  render();
})();
