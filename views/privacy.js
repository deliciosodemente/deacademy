export async function renderPrivacy() {
  const response = await fetch('/views/privacy.html');
  const html = await response.text();
  document.querySelector('main').innerHTML = html;
}