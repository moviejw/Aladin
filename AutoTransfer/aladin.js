chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "GET_BOOK_INFO") return;

  const title = document.querySelector(
    '#trUsed1 > td:nth-child(5)'
    )?.innerText.trim();

  const author = document.querySelector(
    '#trUsed3 table tr td:last-child'
    )?.innerText.trim();

  const rawIsbn = document.querySelector(
    '#trUsed8 table tr td:last-child'
    )?.innerText.trim();

  const publisher = document.querySelector(
    '#trUsed11 table tr td:last-child'
    )?.innerText.trim();

  const publishDate = document.querySelector(
    '#trUsed13 table tr td:last-child'
    )?.innerText.trim();

  const priceStd = document.querySelector('#priceStd')?.value;
  const priceSales = document.querySelector('#priceSales')?.value;


  const data = {
    title: title,
    author: author,
    publisher: publisher,
    isbn: rawIsbn,
    price: priceStd,
    priceSales: priceSales,
    publishDate: convertPublishDate(publishDate)
  };
  console.log("Aladin Book Data:", data);

  chrome.runtime.sendMessage({
    type: "OPEN_YES24",
    payload: data
  });
});


function convertPublishDate(aladinDate) {
  const m = aladinDate.match(
    /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/
  );

  if (!m) return null;

  const [, y, mo, d] = m;

  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}