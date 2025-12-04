let currentISBN = null;
let yes24TabId = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "START_PROCESS") {
        if (!msg.isbns || msg.isbns.length === 0) return;
        currentISBN = msg.isbns[0];
        console.log("처리할 ISBN:", currentISBN);

        // Yes24 탭이 있는지 확인
        if (yes24TabId) {
            chrome.tabs.sendMessage(yes24TabId, { type: "PROCESS_ISBN", isbn: currentISBN });
        } else {
            chrome.tabs.create({ url: "https://uscm.yes24.com/Product/ProductList" }, (tab) => {
                yes24TabId = tab.id;
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === yes24TabId && changeInfo.status === "complete") {
                        chrome.tabs.sendMessage(yes24TabId, { type: "PROCESS_ISBN", isbn: currentISBN });
                        chrome.tabs.onUpdated.removeListener(listener);
                    }
                });
            });
        }
    }

    if (msg.type === "NEXT_ISBN") {
        console.log("모든 ISBN 처리 완료");
        currentISBN = null;
    }
});
