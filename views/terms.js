export async function renderTerms() {
  const response = await fetch('/views/terms.html');
  const html = await response.text();
  document.querySelector('main').innerHTML = html;
}