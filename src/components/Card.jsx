// White rounded panel on the gray page (Figma admin cards).
function Card({ as: Tag = 'section', className = '', children }) {
  return (
    <Tag
      className={`rounded-2xl border border-border bg-white shadow-card ${className}`}
    >
      {children}
    </Tag>
  )
}

export default Card
