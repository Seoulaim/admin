// A labeled form row. htmlFor: the input's id when there is one input;
// leave it out for a group (radios, the four language inputs).
function Field({ label, required = false, hint, error, htmlFor, children }) {
  const Label = htmlFor ? 'label' : 'p'

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
        {required && <span className="ml-0.5 text-point-strong">*</span>}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-sub">{hint}</p>
      )}
    </div>
  )
}

export default Field
