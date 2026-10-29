// A copy of list with the item at `from` moved to `to` (unchanged when
// either is out of range).
export function moveItem(list, from, to) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return list
  }
  const next = [...list]
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}
