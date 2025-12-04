const searchTypeText = "ISBN";
const startYear = 2020;
const endYear = 2025;

// ----------------------
// 메시지 수신 (ProductList용)
// ----------------------
chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === "PROCESS_ISBN" && window.location.pathname.includes("/Product/ProductList")) {
        await searchAndProcessISBN(msg.isbn);
    }
});

// ----------------------
// ProductList → SelectProduct 페이지 신호 관리
// ----------------------
if (window.location.pathname.includes("/Product/SelectProduct/")) {
    window.addEventListener('load', async () => {
        const currentProduct = sessionStorage.getItem('currentProduct');
        const productCode = window.location.pathname.split("/").pop();

        if (currentProduct && currentProduct === productCode) {
            console.log("SelectProduct 처리 시작:", productCode);
            await markSoldOutAndModify();
            chrome.runtime.sendMessage({ type: "NEXT_ISBN" });
            sessionStorage.removeItem('currentProduct');
        }
    });
}

// ----------------------
// 검색 및 상품 처리
// ----------------------
async function searchAndProcessISBN(isbn) {
    for (let year = startYear; year <= endYear; year++) {
        await setSearchOptionsForISBN(isbn, year);
        const codes = getAllProductCodes();

        if (codes.length === 1) {
            // sessionStorage에 현재 처리할 상품 코드 저장
            sessionStorage.setItem('currentProduct', codes[0]);
            // SelectProduct 페이지로 이동
            window.location.href = `/Product/SelectProduct/${codes[0]}`;
            break;
        }
    }
}

// ----------------------
// setSearchOptionsForISBN (판매중 포함)
// ----------------------
function setSearchOptionsForISBN(isbn, year) {
    return new Promise(resolve => {
        const searchFieldset = Array.from(document.querySelectorAll("fieldset.form-group"))
            .find(f => f.querySelector("legend")?.textContent.trim() === "검색어");
        if (!searchFieldset) return resolve();

        const inputGroup = searchFieldset.querySelector("div.input-group");
        if (!inputGroup) return resolve();

        const searchSelect = inputGroup.querySelector("select.custom-select");
        const searchInput = inputGroup.querySelector("input.form-control");

        if (searchSelect && searchInput) {
            searchInput.value = isbn;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));

            const option = Array.from(searchSelect.options)
                .find(opt => opt.text.trim() === searchTypeText);
            if (option) {
                searchSelect.value = option.value;
                searchSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // 판매중 라디오 클릭
        const saleLabel = Array.from(document.querySelectorAll('label.custom-control-label'))
            .find(label => label.textContent.trim() === "판매중");
        if (saleLabel) {
            const saleRadio = document.getElementById(saleLabel.getAttribute('for'));
            if (saleRadio && !saleRadio.checked) {
                saleRadio.click();
                saleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // 연도 선택 후 조회 버튼 클릭
        const yearButton = document.querySelector("button.btn.dropdown-toggle.btn-outline-primary");
        if (!yearButton) return resolve();

        ["mousedown","focus","mouseup","click"].forEach(ev =>
            yearButton.dispatchEvent(new MouseEvent(ev, { bubbles: true }))
        );

        setTimeout(() => {
            const targetYear = Array.from(document.querySelectorAll(".dropdown-item"))
                .find(el => el.textContent.includes(`${year}년`));
            if (!targetYear) return resolve();

            ["mousedown","focus","mouseup","click"].forEach(ev =>
                targetYear.dispatchEvent(new MouseEvent(ev, { bubbles: true }))
            );

            const searchBtn = Array.from(document.querySelectorAll("button.btn"))
                .find(btn => btn.textContent.includes("조회"));
            searchBtn?.click();

            waitForTableLoad().then(() => resolve());
        }, 500);
    });
}

// ----------------------
// 테이블 코드 수집
// ----------------------
function getAllProductCodes() {
    const cells = document.querySelectorAll("#productGrid table td .rg-renderer");
    return Array.from(cells)
        .map(td => td.textContent.trim())
        .filter(text => /^\d{8,9}$/.test(text));
}

function waitForTableLoad(timeout = 5000) {
    return new Promise(resolve => {
        const start = Date.now();

        const checkGrid = () => {
            const grid = document.querySelector("#productGrid");
            if (grid && grid.querySelectorAll("td").length > 0) {
                resolve();
            } else if (Date.now() - start > timeout) {
                resolve();
            } else {
                setTimeout(checkGrid, 100);
            }
        };
        checkGrid();
    });
}

// ----------------------
// 판매완료 + 수정 클릭
// ----------------------
async function markSoldOutAndModify() {
    return new Promise(resolve => {
        let attempts = 0;
        const maxAttempts = 10;

        const tryClick = () => {
            const completeLabel = Array.from(document.querySelectorAll('label.custom-control-label'))
                .find(label => label.textContent.trim() === "판매완료");
            if (completeLabel) {
                const completeRadio = document.getElementById(completeLabel.getAttribute('for'));
                if (completeRadio && !completeRadio.checked) {
                    completeRadio.click();
                    completeRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log("판매완료 선택 완료");
                }
            }

            const btnArea = document.querySelector('.btnarea_wrap_btm');
            if (btnArea) {
                const modifyBtn = Array.from(btnArea.querySelectorAll('button'))
                    .find(btn => btn.textContent.trim() === "수정");
                if (modifyBtn) {
                    modifyBtn.click();
                    console.log("수정 버튼 클릭 완료");
                    return true;
                }
            }
            return false;
        };

        const interval = setInterval(() => {
            attempts++;
            if (tryClick() || attempts >= maxAttempts) {
                clearInterval(interval);
                resolve();
            }
        }, 500);
    });
}
