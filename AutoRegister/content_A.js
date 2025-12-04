chrome.runtime.onMessage.addListener((msg) => {
  if (msg.error) {
    alert(msg.error);
    return;
  }

  if (msg.type !== "FILL_DATA") return;

  const data = msg.payload;

  // 1) ISBN 체크
  document.querySelector("#autoIsbn")?.click();

  // 2) 제목
  document.querySelector("#title").value = data.title || "";

  // 3) 저자/출판사
  document.querySelector("#chkCustomAuthor")?.click();
  document.querySelector("#custom_authorNm0").value = (data.author || "") + " |";
  document.querySelector("#custom_makingCompany").value = data.publisher || "";

  // 4) 상품 정보 입력
  if (data.pages)
    document.querySelector("#ItemPage").value = data.pages;

  // 규격 선택
  // 규격 선택
if (data.sizeStr) {
  const sel = document.querySelector("#selItemSize");
  let matched = false;

  for (const opt of sel.options) {
    if (opt.text.includes(data.sizeStr)) {
      sel.value = opt.value;
      matched = true;
      break;
    }
  }

  if (!matched) {
    // 목록에 없으면 "규격외" 선택 (value=19)
    sel.value = "19";

    // 직접 입력란에 B의 규격 텍스트 입력
    const sizeInput = document.querySelector("#size");
    if (sizeInput) {
      sizeInput.value = data.sizeStr;
    }
  }
}


  // 5) 출간일
  if (data.pubDate) {
    const [yy, mm, dd] = data.pubDate.split("-");

    document.querySelector("#noPubDate1").checked = true;

    document.querySelector("#pubY").value = yy;
    document.querySelector("#pubM").value = Number(mm);
    document.querySelector("#pubD").value = Number(dd);
  }

  // 6) 가격
  if (data.price) {
    document.querySelector("#priceStd").value = data.price;
  }

});
