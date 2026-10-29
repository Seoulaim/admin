// Photos attached to an inquiry; each opens full size in a new tab.
function PhotoStrip({ urls }) {
  if (urls.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2">
      {urls.map((url, i) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt={`첨부 사진 ${i + 1}`}
              className="size-24 rounded-lg border border-border object-cover hover:opacity-80"
            />
          </a>
        </li>
      ))}
    </ul>
  )
}

export default PhotoStrip
