// content.js
(async () => {
  // safety: only run on target page
  if (!location.href.startsWith("https://www.aladin.co.kr/scm/wpopup_category.aspx")) return;

  // load JSON shipped with extension
  async function loadCategoryJson() {
    const url = chrome.runtime.getURL("category_tree_full.json");
    const r = await fetch(url);
    if (!r.ok) throw new Error("category json load failed");
    return await r.json();
  }

  // flatten tree to searchable entries: each entry {pathNames:[], pathCIDs:[], text}
  function buildIndex(tree) {
    const out = [];
    function dfs(node, pathNames, pathCids) {
      const names = pathNames.concat(node.name);
      const cids = pathCids.concat(node.cid);
      out.push({
        pathNames: names.slice(),
        pathCIDs: cids.slice(),
        text: names.join(" / ").toLowerCase()
      });
      if (Array.isArray(node.children)) {
        node.children.forEach(ch => dfs(ch, names, cids));
      }
    }
    tree.forEach(t => dfs(t, [], []));
    return out;
  }

  // search: simple substring match (case-insensitive), return topN
  function searchIndex(index, query, topN = 60) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (const e of index) {
      if (e.text.includes(q)) results.push(e);
    }
    // return in-order; could sort by length or depth
    results.sort((a,b) => a.text.length - b.text.length);
    return results.slice(0, topN);
  }

  // UI injection
  function injectUI() {
    // avoid duplicate
    if (document.querySelector("#catSearchContainer")) return;
    const container = document.createElement("div");
    container.id = "catSearchContainer";
    container.innerHTML = `
      <div id="catSearchHeader">
        <div id="catSearchToggle" title="Toggle">C</div>
        <input id="catSearchInput" placeholder="카테고리 검색 (안된다면 여러 번 클릭)" />
        <div class="small-muted" id="catSearchHelp"></div>
      </div>
      <div id="catSearchResults"></div>
    `;
    document.body.appendChild(container);

    const toggle = container.querySelector("#catSearchToggle");
    const input = container.querySelector("#catSearchInput");
    const resultsBox = container.querySelector("#catSearchResults");

    // allow hide/show
    let visible = true;
    toggle.addEventListener("click", () => {
      visible = !visible;
      resultsBox.style.display = visible ? "block" : "none";
    });

    return { container, input, resultsBox };
  }

  // safe helper: dispatch events on element (works across isolated worlds)
  function dispatchEvent(el, name) {
    const ev = new Event(name, { bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
  }

  // wait for select element to contain option with given value (string or number)
  function waitForOption(selectEl, value, timeout = 3000) {
    const want = String(value);
    return new Promise((resolve, reject) => {
      if (!selectEl) return reject(new Error("select not found"));
      // immediate check
      for (const opt of Array.from(selectEl.options)) {
        if (String(opt.value) === want) return resolve(true);
      }
      // observer
      const to = setTimeout(() => {
        obs.disconnect();
        reject(new Error("timeout waiting for option"));
      }, timeout);

      const obs = new MutationObserver(() => {
        for (const opt of Array.from(selectEl.options)) {
          if (String(opt.value) === want) {
            clearTimeout(to);
            obs.disconnect();
            resolve(true);
            return;
          }
        }
      });

      obs.observe(selectEl, { childList: true, subtree: true });
    });
  }

  // core: sequentially select each level by CID path
  async function selectCategoryByCIDPath(cidPath) {
    // Expected selects: #c0 (대분류), #c1 (중분류), #c2, #c3 ...
    if (!Array.isArray(cidPath) || cidPath.length === 0) return;

    // Helper to get select element for level i: c0..c3
    const getSelect = (i) => document.querySelector(`#c${i}`);

    // set level 0
    try {
      // choose top-level select and set value
      const top = getSelect(0);
      if (!top) throw new Error("top select (#c0) not found");
      // set value: ensure option exists
      let optFound = Array.from(top.options).find(o => String(o.value) === String(cidPath[0]));
      if (!optFound) {
        // if the option doesn't exist, as fallback set selectedIndex to option whose text matches name?
        // but we assume our c0 is same as page options
        console.warn("top option not found for", cidPath[0]);
      } else {
        top.value = optFound.value;
      }
      // dispatch click/change so page JS runs (onclick on select triggers goCat)
      dispatchEvent(top, "click");
      dispatchEvent(top, "change");
    } catch (e) {
      console.error("failed to set top select:", e);
      return;
    }

    // For subsequent levels, wait for select to populate and select value
    for (let level = 1; level < cidPath.length; level++) {
      const wantCid = cidPath[level];
      const sel = getSelect(level);
      if (!sel) {
        // wait for it to be created in DOM (the page creates c1/c2/etc.)
        // poll for up to 2s
        const start = Date.now();
        while (!document.querySelector(`#c${level}`)) {
          await new Promise(r => setTimeout(r, 80));
          if (Date.now() - start > 3000) break;
        }
      }
      const selNow = getSelect(level);
      if (!selNow) {
        console.warn("select level not found", level);
        continue;
      }

      // wait until option appears
      try {
        await waitForOption(selNow, wantCid, 4000);
      } catch (_) {
        // if option never appears, still try to set first available
        console.warn(`option ${wantCid} did not appear at level ${level}`);
      }

      // set value if option exists
      const opt = Array.from(selNow.options).find(o => String(o.value) === String(wantCid));
      if (opt) {
        selNow.value = opt.value;
        dispatchEvent(selNow, "click");
        dispatchEvent(selNow, "change");
      } else {
        // fallback: no matching option, skip
        console.warn("no matching option to select for level", level, wantCid);
      }

      // small delay to allow next level load
      await new Promise(r => setTimeout(r, 120));
    }
  }

  // render search results
  function renderResults(resultsBox, entries) {
    resultsBox.innerHTML = "";
    if (!entries.length) {
      resultsBox.innerHTML = `<div class="cat-item small-muted">검색결과 없음</div>`;
      return;
    }
    for (const e of entries) {
      const div = document.createElement("div");
      div.className = "cat-item";
      const pathText = e.pathNames.join(" / ");
      div.innerHTML = `<div class="cat-path">${pathText}</div>
                       <div class="cat-sub">CID: ${e.pathCIDs.join(" → ")}</div>`;
      div.addEventListener("click", async () => {
        try {
          // call selection
          await selectCategoryByCIDPath(e.pathCIDs);
        } catch (err) {
          console.error("selection error:", err);
          alert("선택 중 오류가 발생했습니다. 콘솔 확인");
        }
      });
      resultsBox.appendChild(div);
    }
  }

  // initialize extension UI + index
  let tree;
  try {
    tree = await loadCategoryJson();
  } catch (err) {
    console.error("category json load failed", err);
    return;
  }
  const index = buildIndex(tree);
  const ui = injectUI();
  const input = ui.input;
  const resultsBox = ui.resultsBox;

  // input handling with debounce
  let debounceTimer = null;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = input.value.trim();
      if (!q) {
        resultsBox.innerHTML = "";
        return;
      }
      const hits = searchIndex(index, q, 80);
      renderResults(resultsBox, hits);
    }, 180);
  });

  // keyboard: Enter selects first result
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      const first = resultsBox.querySelector(".cat-item");
      if (first) first.click();
    }
  });

  // small helper: allow closing with Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const cont = document.querySelector("#catSearchContainer");
      if (cont) cont.remove();
    }
  });

})();
