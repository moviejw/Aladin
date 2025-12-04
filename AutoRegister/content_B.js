function getText(selector) {
  const el = document.querySelector(selector);
  return el ? el.textContent.trim() : "";
}

function queryAllText(selector) {
  return [...document.querySelectorAll(selector)].map(e => e.textContent.trim());
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "REQUEST_BOOK_INFO") return;

  try {
    const title = getText(".Ere_bo_title"); 
    const author = getText("a.Ere_sub2_title[href*='AuthorSearch']");
    const publisher = getText("a.Ere_sub2_title[href*='PublisherSearch']");
    
    // 상품정보
    const infoList = queryAllText(".conts_info_list1 ul li");
    const pages = infoList.find(x => x.endsWith("쪽"))?.replace("쪽", "").trim() || "";
    const sizeStr = infoList.find(x => x.includes("mm")) || "";
    const weight = infoList.find(x => x.endsWith("g")) || "";
    const isbn = infoList.find(x => x.includes("ISBN"))?.replace("ISBN :", "").trim() || "";

    // 출간일
    const dateLi = document.querySelector("li.Ere_sub2_title:last-child");
    let pubDate = "";
    if (dateLi) {
      const txt = dateLi.textContent.trim();
      const match = txt.match(/\d{4}-\d{2}-\d{2}/);
      pubDate = match ? match[0] : "";
    }

    // 가격
    const priceLi = document.querySelector("div.Ritem");
    let price = "";
    if (priceLi) {
      price = priceLi.textContent.replace(/원/g, "").replace(/\D/g, "");
    }

    sendResponse({
      title,
      author,
      publisher,
      pages,
      sizeStr,
      weight,
      isbn,
      pubDate,
      price
    });
  } catch (e) {
    sendResponse({ error: e.toString() });
  }

  return true;
});
