export async function renderHelp() {
  const response = await fetch('/views/help.html');
  const html = await response.text();
  document.querySelector('main').innerHTML = html;
}