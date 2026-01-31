chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "register-book",
    title: "YES24 도서 등록",
    contexts: ["page"],
    documentUrlPatterns: [
      "https://www.aladin.co.kr/scm/wrecord.aspx*"
    ]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  chrome.tabs.sendMessage(tab.id, { type: "GET_BOOK_INFO" });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "OPEN_YES24") return;
  if (isOfficialISBN(msg.payload.isbn)) {
    chrome.storage.local.set({ bookData: msg.payload }, () => {
    chrome.tabs.create({
      url: "https://uscm.yes24.com/Product/IndividualRegistrationList"
      });
    });
  }
  else {
    chrome.storage.local.set({ bookData: msg.payload }, () => {
      chrome.tabs.create({
        url: "https://uscm.yes24.com/Product/NewProductInsert"
      });
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.url &&
    changeInfo.url.includes('/Product/IndividualRegistrationInsert/')
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['yes24_insert.js']
    });
  }
});

function isOfficialISBN(isbn) {
  return /^(97(8|9))?\d{9}(\d|X)$/.test(isbn);
}