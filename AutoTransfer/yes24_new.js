
chrome.storage.local.get("bookData", ({ bookData }) => {
  if (!bookData) return;
  findInputByLabelText('상품명').value = bookData.title;
  findInputByLabelText('저자/아티스트').value = bookData.author;
  findInputByLabelText('출판사/기획사/제조사').value = bookData.publisher;
  findInputByLabelText('정가').value = bookData.price;
  findInputByLabelText('중고판매가').value = bookData.priceSales;
  findInputByLabelText('발행일').value = bookData.publishDate;

  clickAlwaysButton();
});

function findInputByLabelText(labelText) {
  const groups = document.querySelectorAll('.yes_form_group');

  for (const group of groups) {
    const label = group.querySelector('label');
    if (!label) continue;

    if (label.innerText.includes(labelText)) {
      return group.querySelector('input, textarea, select');
    }
  }
  return null;
}

function clickAlwaysButton() {
  const buttons = document.querySelectorAll(
    '.datepicker_btngroup button'
  );

  for (const btn of buttons) {
    if (btn.innerText.trim() === '상시') {
      btn.click();
      return true;
    }
  }
  return false;
}