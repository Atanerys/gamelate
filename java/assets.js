
const cache = {};

export function img(file) {
  if (!file) return null;
  if (!cache[file]) { const i = new Image(); i.src = 'img/' + encodeURI(file); cache[file] = i; }
  const i = cache[file];
  return i.complete && i.naturalWidth ? i : null;
}
