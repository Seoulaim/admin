import { useState } from 'react'
import Button from '../../components/Button.jsx'
import Card from '../../components/Card.jsx'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import MoveButtons from '../../components/MoveButtons.jsx'
import { ALL, NONE } from './stickers.js'

function CategoryEditor({ category, onSave, onCancel }) {
  const [name, setName] = useState(category?.name ?? {})
  const [invalid, setInvalid] = useState(false)

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-panel p-2">
      <LocalizedInput
        id={`category-${category?.id ?? 'new'}`}
        required
        value={name}
        onChange={setName}
        invalid={invalid}
        maxLength={20}
      />
      <div className="flex justify-end gap-1.5">
        <Button size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => (name.en?.trim() ? onSave(name) : setInvalid(true))}
        >
          저장
        </Button>
      </div>
    </div>
  )
}

// Left side of 스티커: filter by category (전체 / each / 미분류), and the
// categories themselves — names in 4 languages and the order of the
// editor's category chips ("All" is added by the app).
function CategoryPanel({
  categories,
  counts,
  selected,
  onSelect,
  onSave,
  onDelete,
  onMove,
}) {
  const [editing, setEditing] = useState(null) // category id or 'new'
  const [ordering, setOrdering] = useState(false)

  const item = (id, label, count) => (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected === id}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold ${selected === id ? 'bg-point-soft text-point-strong' : 'hover:bg-chip'}`}
    >
      <span className="truncate">{label}</span>
      <span className="text-xs font-medium text-sub tabular-nums">{count}</span>
    </button>
  )

  return (
    <Card className="flex flex-col gap-1 p-3">
      {item(ALL, '전체', counts[ALL])}
      <div className="my-1 flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-sub">카테고리</h2>
        <button
          type="button"
          onClick={() => setOrdering((on) => !on)}
          className="text-xs font-semibold text-muted hover:text-text"
        >
          {ordering ? '완료' : '순서 수정'}
        </button>
      </div>
      {categories.map((category, index) =>
        editing === category.id ? (
          <CategoryEditor
            key={category.id}
            category={category}
            onSave={async (name) =>
              (await onSave(category, name)) && setEditing(null)
            }
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={category.id} className="group flex items-center gap-1">
            <div className="min-w-0 flex-1">
              {item(
                category.id,
                category.name.ko || category.name.en,
                counts[category.id] ?? 0,
              )}
            </div>
            {ordering ? (
              <MoveButtons
                index={index}
                count={categories.length}
                onMove={(to) => onMove(index, to)}
              />
            ) : (
              <div className="hidden gap-1 group-focus-within:flex group-hover:flex">
                <button
                  type="button"
                  onClick={() => setEditing(category.id)}
                  className="rounded px-1.5 text-xs font-semibold text-muted hover:bg-chip"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  className="rounded px-1.5 text-xs font-semibold text-danger hover:bg-danger/5"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        ),
      )}
      {editing === 'new' ? (
        <CategoryEditor
          onSave={async (name) =>
            (await onSave(null, name)) && setEditing(null)
          }
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted hover:bg-chip"
        >
          + 카테고리 추가
        </button>
      )}
      <div className="mt-1 border-t border-border pt-1">
        {item(NONE, '미분류', counts[NONE])}
      </div>
    </Card>
  )
}

export default CategoryPanel
