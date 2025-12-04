// content/aladin.js
document.addEventListener('click', (e) => {
    const link = e.target.closest("a[name2], a.name2"); // 주문번호 링크
    if (!link) return;

    const href = link.getAttribute('onclick'); // javascript:return viewOrderDetail('001-A337358838');
    if (!href) return;

    const match = href.match(/viewOrderDetail\('([^']+)'\)/);
    if (!match) return;
    const orderNo = match[1];
    const popupUrl = `https://www.aladin.co.kr/scm/wpopup_order.aspx?ono=${orderNo}`;

    // 팝업 열기
    const popup = window.open(popupUrl, "_blank", "width=800,height=600");

    // 로딩 기다렸다가 ISBN 추출
    const interval = setInterval(() => {
        if (!popup || !popup.document || !popup.document.body) return;

        const tdList = popup.document.querySelectorAll("tr td:nth-child(3)");
        const isbns = [];
        tdList.forEach(td => {
            const match = td.innerText.match(/\b\d{13}\b/);
            if (match) isbns.push(match[0]);
        });

        if (isbns.length > 0) {
            clearInterval(interval);
            console.log("추출된 ISBN:", isbns);
            chrome.runtime.sendMessage({ type: "START_PROCESS", isbns });
        }
    }, 500);
});
