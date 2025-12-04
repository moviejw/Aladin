chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "autoFillUsedBook",
    title: "자동 입력",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "autoFillUsedBook") return;

  // A 페이지 탭 id
  const aTabId = tab.id;

  // 현재 열린 탭에서 B(wproduct) 페이지 찾기
  let [bTab] = await chrome.tabs.query({
    url: "*://www.aladin.co.kr/shop/wproduct.aspx*"
  });

  if (!bTab) {
    chrome.tabs.sendMessage(aTabId, { error: "페이지가 열려 있지 않습니다." });
    return;
  }

  // B 페이지에게 정보 요청
  chrome.tabs.sendMessage(bTab.id, { type: "REQUEST_BOOK_INFO" }, (bookInfo) => {
    if (!bookInfo || bookInfo.error) {
      chrome.tabs.sendMessage(aTabId, { error: "정보를 가져오지 못함" });
      return;
    }

    // A 페이지(입력폼)에 전달
    chrome.tabs.sendMessage(aTabId, {
      type: "FILL_DATA",
      payload: bookInfo
    });
  });
});
