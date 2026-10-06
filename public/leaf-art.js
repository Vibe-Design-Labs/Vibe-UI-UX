// Vector interpretation of the approved IntentKit leaf cursor concept.
export const leafArt = Object.freeze({
  viewBox: 24, hotspot: [1.5, 1.5], body: '#3E4535', vein: '#F4ECD9', accent: '#B5452E',
  outline: 'M1.5 1.5C4.1 3.1 6.8 4.2 9.7 5.5C12.2 6.6 14.4 7.6 16.3 8.6C17.8 9.4 18.7 10.9 18.9 12.3C19.1 13.6 20.7 14 21.5 15.4C22.4 17 22.4 18.6 21.7 20C21.1 21.2 21.5 21.9 22.4 22.5C23.2 23.1 22.4 23.6 21.6 23.4C20.3 23.3 19.4 22.4 18.3 22C16.1 21 13.6 21.4 11.4 20.7C8.7 19.9 7.5 18.4 6.4 16C5.4 13.8 4.9 11.4 4 9C3.2 6.7 2.3 3.9 1.5 1.5Z',
  veinPath: 'M4.3 4.2C8 8.1 11.5 11.2 14.1 15.2C16.4 18.7 18.6 21.5 21.5 22.4C18.2 19.2 16.8 16.1 14.4 13.1C11.3 9.4 7.8 7 4.3 4.2Z',
  accentPath: 'M2.5 2.7C3.5 3.4 5.1 4.5 5.4 5.5C5.8 6.8 4.7 7.1 4.1 6C3.5 5 2.9 3.6 2.5 2.7Z'
});
export function leafMarkup(color = leafArt.body) {
  if (!/^#[\da-f]{6}$/i.test(color)) throw new Error('Invalid leaf color');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="' + leafArt.outline + '" fill="' + color + '" stroke="#34362E" stroke-width=".28" stroke-linejoin="round"/>' +
    '<path d="' + leafArt.veinPath + '" fill="' + leafArt.vein + '"/>' +
    '<path d="' + leafArt.accentPath + '" fill="' + leafArt.accent + '"/></svg>';
}
export function createLeafSvg(color = leafArt.body) {
  // Markup contains only fixed paths and a validated six-digit color.
  const template = document.createElement('template'); template.innerHTML = leafMarkup(color);
  return template.content.firstElementChild;
}
