import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  createGroup,
  deleteGroup,
  getGroup,
  getGroupLinks,
  updateGroup,
} from '../../api/artists.js'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Field from '../../components/form/Field.jsx'
import FormCard from '../../components/form/FormCard.jsx'
import ImageInput from '../../components/form/ImageInput.jsx'
import { inputClass } from '../../components/form/inputClass.js'
import LocalizedInput from '../../components/form/LocalizedInput.jsx'
import LoadError from '../../components/LoadError.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useDragSort } from '../../hooks/useDragSort.js'
import { useFetch } from '../../hooks/useFetch.js'
import { moveItem } from '../../lib/arrays.js'
import { PHOTO_ASPECT } from '../../lib/artists.js'
import MemberRow from './MemberRow.jsx'

const BACK_TO = '/artists'

const emptyGroup = () => ({
  name: {},
  imageUrl: '',
  debutDate: null,
  note: '',
  members: [],
})

const NO_LINKS = { onlyEntries: 0, sharedEntries: 0, cafes: {}, places: {} }

const emptyMember = () => ({ name: {}, imageUrl: '', birthDate: null })

// A stable React key per member row (new members have no id yet).
let nextKey = 0
const withKey = (member) => ({ ...member, key: nextKey++ })

function validate(form) {
  const errors = {}
  if (!form.name.en?.trim()) errors.name = '영어 그룹 이름은 꼭 입력해 주세요.'
  if (form.members.length === 0) {
    errors.members = '멤버를 한 명 이상 추가해 주세요.'
  }
  const unnamed = form.members.filter((m) => !m.name.en?.trim())
  if (unnamed.length > 0) errors.memberKeys = new Set(unnamed.map((m) => m.key))
  return errors
}

// 새 그룹 추가 (/artists/new) and edit (/artists/:groupId/edit): the group
// and its members, saved together.
function GroupFormPage() {
  const { groupId } = useParams()
  const fetcher = useCallback(
    () =>
      groupId
        ? Promise.all([getGroup(groupId), getGroupLinks(groupId)]).then(
            ([group, links]) => ({ group, links }),
          )
        : Promise.resolve(null),
    [groupId],
  )
  const { data, error, reload } = useFetch(fetcher)

  return (
    <>
      <PageHeader
        title={`그룹·멤버 관리 · ${groupId ? '그룹 수정' : '새 그룹 추가'}`}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        {error ? (
          <LoadError onRetry={reload} className="py-24" />
        ) : data === undefined ? (
          <p className="py-24 text-center text-sm text-sub">불러오는 중…</p>
        ) : (
          <GroupForm
            key={groupId ?? 'new'}
            initial={data?.group ?? emptyGroup()}
            links={data?.links ?? NO_LINKS}
          />
        )}
      </main>
    </>
  )
}

// What deleting the group takes with it, for the confirm dialog.
function groupDeleteMessage(group, links) {
  const sum = (counts) =>
    Object.values(counts).reduce((total, n) => total + n, 0)
  const cafes = sum(links.cafes)
  const places = sum(links.places)
  return [
    `'${group.name.en}'과(와) 멤버 ${group.members.length}명이 삭제돼요. 되돌릴 수 없어요.`,
    links.onlyEntries > 0 &&
      `이 그룹만 지정한 일정·이벤트 ${links.onlyEntries}개도 함께 삭제돼요.`,
    links.sharedEntries > 0 &&
      `다른 그룹과 함께 지정한 일정·이벤트 ${links.sharedEntries}개에서는 이 그룹만 빠져요.`,
    cafes > 0 && `멤버들의 생일카페 ${cafes}개도 함께 삭제돼요.`,
    places > 0 && `장소 태그 ${places}개에서 멤버들이 빠져요.`,
  ]
    .filter(Boolean)
    .join('\n')
}

function GroupForm({ initial, links }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({
    ...initial,
    members: initial.members.map(withKey),
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [removing, setRemoving] = useState(null) // a saved member to take out
  const [deleting, setDeleting] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const editing = Boolean(initial.id)

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }))
  const setMembers = (fn) =>
    setForm((prev) => ({ ...prev, members: fn(prev.members) }))
  const move = (from, to) => setMembers((list) => moveItem(list, from, to))
  const dragProps = useDragSort(move)
  const removeMember = (key) =>
    setMembers((list) => list.filter((m) => m.key !== key))

  async function save(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const fields = {
      name: form.name,
      imageUrl: form.imageUrl,
      debutDate: form.debutDate || null,
      note: form.note.trim(),
      members: form.members.map(({ id, name, imageUrl, birthDate }) => ({
        id,
        name,
        imageUrl,
        birthDate,
      })),
    }
    setSaving(true)
    setSaveFailed(false)
    try {
      const saved = editing
        ? await updateGroup(initial.id, fields)
        : await createGroup(fields)
      navigate(BACK_TO, { state: { toast: '저장했어요.', open: saved.id } })
    } catch {
      setSaveFailed(true)
      setSaving(false)
    }
  }

  async function confirmDeleteGroup() {
    setDeleteBusy(true)
    try {
      await deleteGroup(initial.id)
      navigate(BACK_TO, { state: { toast: '그룹을 삭제했어요.' } })
    } catch {
      setDeleteBusy(false)
      setDeleting(false)
      setSaveFailed(true)
    }
  }

  return (
    <form onSubmit={save} noValidate className="max-w-4xl">
      <FormCard
        cancelTo={BACK_TO}
        saving={saving}
        saveFailed={saveFailed}
        footerStart={
          editing && (
            <Button variant="danger" onClick={() => setDeleting(true)}>
              그룹 삭제
            </Button>
          )
        }
      >
        <section className="flex flex-col gap-6 sm:flex-row">
          <Field label="그룹 사진" htmlFor="groupPhoto">
            <ImageInput
              id="groupPhoto"
              value={form.imageUrl}
              onChange={set('imageUrl')}
              aspect={PHOTO_ASPECT}
              sizeClass="w-36"
              compact
            />
          </Field>
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <Field label="그룹 이름" required error={errors.name}>
              <LocalizedInput
                id="groupName"
                required
                columns
                value={form.name}
                onChange={set('name')}
                invalid={Boolean(errors.name)}
              />
            </Field>
            <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
              <Field label="데뷔일" htmlFor="debutDate">
                <input
                  id="debutDate"
                  type="date"
                  value={form.debutDate ?? ''}
                  onChange={(event) => set('debutDate')(event.target.value)}
                  className={`${inputClass} h-10 sm:w-44`}
                />
              </Field>
              <Field
                label="관리자 메모"
                htmlFor="note"
                hint="앱에는 나오지 않아요."
              >
                <input
                  id="note"
                  value={form.note}
                  onChange={(event) => set('note')(event.target.value)}
                  maxLength={200}
                  className={`${inputClass} h-10`}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">
                멤버{' '}
                <span className="text-sub tabular-nums">
                  {form.members.length}명
                </span>
              </h2>
              <p className="text-xs text-sub">
                이 순서대로 앱의 멤버 목록에 보여요. 끌거나 ↑↓로 바꿔요.
              </p>
            </div>
            <Button
              onClick={() =>
                setMembers((list) => [...list, withKey(emptyMember())])
              }
            >
              + 멤버 추가
            </Button>
          </div>
          {errors.members && (
            <p role="alert" className="text-xs font-medium text-danger">
              {errors.members}
            </p>
          )}
          <ol className="flex flex-col gap-2">
            {form.members.map((member, index) => (
              <MemberRow
                key={member.key}
                member={member}
                index={index}
                count={form.members.length}
                onChange={(next) =>
                  setMembers((list) =>
                    list.map((m) => (m.key === member.key ? next : m)),
                  )
                }
                onMove={(to) => move(index, to)}
                onRemove={() =>
                  member.id ? setRemoving(member) : removeMember(member.key)
                }
                drag={dragProps(index)}
                invalid={Boolean(errors.memberKeys?.has(member.key))}
              />
            ))}
          </ol>
        </section>
      </FormCard>

      <ConfirmDialog
        open={Boolean(removing)}
        title={`${removing?.name.en ?? ''}을(를) 뺄까요?`}
        message={[
          '저장하면 이 멤버가 삭제돼요. 이 멤버를 최애로 고른 회원의 최애 목록에서도 빠져요.',
          links.cafes[removing?.id] &&
            `이 멤버의 생일카페 ${links.cafes[removing.id]}개도 함께 삭제돼요.`,
          links.places[removing?.id] &&
            `장소 ${links.places[removing.id]}곳의 멤버 태그에서도 빠져요.`,
        ]
          .filter(Boolean)
          .join('\n')}
        confirmLabel="빼기"
        danger
        onConfirm={() => {
          removeMember(removing.key)
          setRemoving(null)
        }}
        onCancel={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={deleting}
        title="그룹을 삭제할까요?"
        message={groupDeleteMessage(initial, links)}
        confirmLabel="삭제"
        danger
        busy={deleteBusy}
        onConfirm={confirmDeleteGroup}
        onCancel={() => setDeleting(false)}
      />
    </form>
  )
}

export default GroupFormPage
