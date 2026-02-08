// Utilità per riordinare elementi in modo immutabile
export function reorder(items, fromIndex, toIndex) {
  const list = Array.isArray(items) ? [...items] : [];
  const length = list.length;

  if (length === 0) {
    return list;
  }

  if (fromIndex < 0 || fromIndex >= length) {
    return list;
  }

  const startIndex = Math.max(0, Math.min(fromIndex, length - 1));
  let insertIndex = Math.max(0, Math.min(toIndex, length));

  if (startIndex === insertIndex) {
    return list;
  }

  if (startIndex < insertIndex) {
    insertIndex -= 1;
  }

  const [moved] = list.splice(startIndex, 1);
  list.splice(insertIndex, 0, moved);

  return list;
}
