
chrome.storage.local.get("bookData", ({ bookData }) => {
  if (!bookData) {
    return;
  }

  findInputByLabelText('중고판매가').value = bookData.priceSales;

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
  const observer = new MutationObserver(() => {
    const inputs = document.querySelectorAll('input.gtDate.flatpickr-input');
    if (inputs.length >= 2 && inputs[1].value !== '2099-12-31') {
      inputs[1].value = '2099-12-31';
      inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      console.log('insert overwrite 이후 재세팅');
    }
  });

  observer.observe(document.body, { subtree: true, childList: true });
}