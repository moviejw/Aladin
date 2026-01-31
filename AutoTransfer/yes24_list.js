chrome.storage.local.get("bookData", ({ bookData }) => {
  if (!bookData) return;

  const isbn = bookData.isbn;
  const input = document.querySelector('.col-8.col-md-9.form-control');
  input.focus();
  input.value = isbn;

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  document.querySelector(".btn.btn-secondary").click();
  waitAndClickRegisterButton().catch((err) => {
    console.error(err);
  });
});
function waitAndClickRegisterButton(timeout = 10000) {
  return new Promise((resolve, reject) => {

    const findRegisterButton = () =>
      [...document.querySelectorAll('.rg-button-renderer-button')]
        .find(b => b.innerText.includes('등록'));

    const btn = findRegisterButton();
    if (btn) {
      btn.click();
      return resolve(true);
    }

    const observer = new MutationObserver(() => {
      const button = findRegisterButton();
      if (button) {
        observer.disconnect();
        button.click();
        resolve(true);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error('등록 버튼 로딩 타임아웃'));
    }, timeout);
  });
}
