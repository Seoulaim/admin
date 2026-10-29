import Card from '../components/Card.jsx'
import PageHeader from '../components/PageHeader.jsx'

// Placeholder for a menu screen that isn't built yet: what it will do.
function PlannedPage({ item }) {
  return (
    <>
      <PageHeader title={item.label} />
      <main className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl p-6">
          <p className="mb-1 text-xs font-semibold text-point-strong">
            준비 중
          </p>
          <h2 className="mb-4 text-lg font-bold">이 화면에서 할 일</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
            {item.plan.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      </main>
    </>
  )
}

export default PlannedPage
