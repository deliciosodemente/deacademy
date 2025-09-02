export async function renderContact() {
  const response = await fetch('/views/contact.html');
  const html = await response.text();
  document.querySelector('main').innerHTML = html;
}