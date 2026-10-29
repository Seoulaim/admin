import Button from './Button.jsx'

// ↑ / ↓ next to a reorderable row (for when dragging isn't handy).
function MoveButtons({ index, count, onMove }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        size="sm"
        aria-label="위로"
        onClick={() => onMove(index - 1)}
        disabled={index === 0}
      >
        ↑
      </Button>
      <Button
        size="sm"
        aria-label="아래로"
        onClick={() => onMove(index + 1)}
        disabled={index === count - 1}
      >
        ↓
      </Button>
    </div>
  )
}

export default MoveButtons
