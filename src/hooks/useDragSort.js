import { useRef } from 'react'

// Drag-to-reorder for a list's rows: spread dragProps(index) on each row.
// move(from, to) reorders the list while dragging (e.g. with moveItem).
export function useDragSort(move) {
  const dragging = useRef(null)

  return (index) => ({
    draggable: true,
    onDragStart: () => {
      dragging.current = index
    },
    onDragOver: (event) => {
      event.preventDefault()
      if (dragging.current === null || dragging.current === index) return
      move(dragging.current, index)
      dragging.current = index
    },
    onDragEnd: () => {
      dragging.current = null
    },
  })
}
