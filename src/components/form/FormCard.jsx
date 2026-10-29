import { Link } from 'react-router'
import Button from '../Button.jsx'
import { buttonClass } from '../buttonClass.js'
import Card from '../Card.jsx'

// A form's card: the fields, then 취소 (back to cancelTo) / 저장 at the
// bottom. footerStart: more actions on the left (e.g. 삭제).
function FormCard({ cancelTo, saving, saveFailed, footerStart, children }) {
  return (
    <Card className="flex flex-col">
      <div className="flex flex-col gap-7 p-5 sm:p-8">{children}</div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-8">
        <div className="mr-auto flex items-center gap-3">
          {footerStart}
          {saveFailed && (
            <p role="alert" className="text-sm font-medium text-danger">
              저장하지 못했어요. 다시 시도해 주세요.
            </p>
          )}
        </div>
        <Link to={cancelTo} className={buttonClass()}>
          취소
        </Link>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? '저장 중…' : '저장'}
        </Button>
      </div>
    </Card>
  )
}

export default FormCard
