import { useState } from 'react'
import { nameMatches } from '../../lib/artists.js'
import { inputClass } from './inputClass.js'

const MAX_RESULTS = 8

// Members tagged on something (any groups; always per member). Search by
// any language, or open a group and tick members ("전원 선택" ticks them
// all — still saved one by one). value: member ids.
function MemberPicker({ groups, value, onChange }) {
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState('')
  const selected = new Set(value)
  const toggle = (id) =>
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id])
  const addAll = (members) =>
    onChange([
      ...value,
      ...members.map((m) => m.id).filter((id) => !selected.has(id)),
    ])

  const results = query.trim()
    ? groups
        .flatMap((group) =>
          nameMatches(group.name, query)
            ? group.members.map((member) => ({ group, member }))
            : group.members
                .filter((m) => nameMatches(m.name, query))
                .map((member) => ({ group, member })),
        )
        .slice(0, MAX_RESULTS)
    : []
  const browsing = groups.find((g) => g.id === groupId)
  const chosenGroups = groups
    .map((group) => ({
      group,
      members: group.members.filter((m) => selected.has(m.id)),
    }))
    .filter((g) => g.members.length > 0)

  const chip = (member, checked) =>
    `h-8 rounded-full border px-3 text-[13px] font-semibold ${checked ? 'border-point bg-point-soft text-point-strong' : 'border-border text-muted hover:bg-chip'}`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <input
            type="search"
            aria-label="멤버 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results[0]) {
                event.preventDefault()
                if (!selected.has(results[0].member.id))
                  toggle(results[0].member.id)
                setQuery('')
              }
            }}
            placeholder="멤버·그룹 이름 검색 (예: 산, san, 에이티즈)"
            className={`${inputClass} h-10`}
          />
          {query.trim() && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-sub">
                  찾는 멤버가 없어요.
                </li>
              ) : (
                results.map(({ group, member }) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => toggle(member.id)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-chip"
                    >
                      <span>
                        <span className="text-sub">{group.name.en} · </span>
                        <span className="font-semibold">{member.name.en}</span>
                        {member.name.ko && (
                          <span className="ml-1 text-muted">
                            {member.name.ko}
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-bold text-point-strong">
                        {selected.has(member.id) ? '선택됨 ✓' : '+ 추가'}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <select
          aria-label="그룹에서 고르기"
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          className={`${inputClass} h-10 w-auto`}
        >
          <option value="">그룹에서 고르기</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name.en}
            </option>
          ))}
        </select>
      </div>

      {browsing && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-panel p-3">
          {browsing.members.map((member) => (
            <button
              key={member.id}
              type="button"
              aria-pressed={selected.has(member.id)}
              onClick={() => toggle(member.id)}
              className={chip(member, selected.has(member.id))}
            >
              {member.name.en}
            </button>
          ))}
          <button
            type="button"
            onClick={() => addAll(browsing.members)}
            className="ml-auto text-xs font-semibold text-muted hover:text-text"
          >
            전원 선택
          </button>
        </div>
      )}

      {chosenGroups.length === 0 ? (
        <p className="text-sm text-sub">태그한 멤버가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {chosenGroups.map(({ group, members }) => (
            <li key={group.id} className="flex flex-wrap items-center gap-1.5">
              <span className="w-24 shrink-0 truncate text-xs font-bold text-sub">
                {group.name.en}
              </span>
              {members.map((member) => (
                <span
                  key={member.id}
                  className="flex h-8 items-center gap-1 rounded-full bg-point-soft pr-1.5 pl-3 text-[13px] font-semibold text-point-strong"
                >
                  {member.name.en}
                  <button
                    type="button"
                    aria-label={`${member.name.en} 빼기`}
                    onClick={() => toggle(member.id)}
                    className="flex size-5 items-center justify-center rounded-full hover:bg-white/70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MemberPicker
