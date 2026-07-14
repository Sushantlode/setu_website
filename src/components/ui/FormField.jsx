import { useId } from "react"

const controlClass =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-setu-charcoal outline-none transition placeholder:text-setu-muted/70 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"

function controlBorder(error, className = "") {
  return `${controlClass} ${
    error
      ? "border-red-300 focus:ring-red-200"
      : "border-teal-100 focus:ring-teal-300"
  } ${className}`.trim()
}

export function FormField({
  label,
  error,
  hint,
  required,
  className = "",
  children,
  htmlFor,
}) {
  const autoId = useId()
  const id = htmlFor || autoId

  return (
    <div className={`block text-sm ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 block font-medium text-setu-charcoal">
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      )}
      {typeof children === "function" ? children(id) : children}
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-setu-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormTextField(props) {
  const {
    label,
    error,
    hint,
    required,
    className = "",
    inputClassName = "",
    id: idProp,
    ...rest
  } = props
  const autoId = useId()
  const id = idProp || autoId
  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={id}
      className={className}
    >
      <input id={id} className={controlBorder(error, inputClassName)} {...rest} />
    </FormField>
  )
}

export function FormSelectField(props) {
  const {
    label,
    error,
    hint,
    required,
    className = "",
    inputClassName = "",
    children,
    id: idProp,
    ...rest
  } = props
  const autoId = useId()
  const id = idProp || autoId
  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={id}
      className={className}
    >
      <select id={id} className={controlBorder(error, inputClassName)} {...rest}>
        {children}
      </select>
    </FormField>
  )
}

export function FormTextAreaField(props) {
  const {
    label,
    error,
    hint,
    required,
    className = "",
    inputClassName = "",
    id: idProp,
    rows = 3,
    ...rest
  } = props
  const autoId = useId()
  const id = idProp || autoId
  return (
    <FormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={id}
      className={className}
    >
      <textarea
        id={id}
        rows={rows}
        className={controlBorder(error, inputClassName)}
        {...rest}
      />
    </FormField>
  )
}

export function FormErrorBanner({ children, className = "" }) {
  if (!children) return null
  return (
    <p
      className={`rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
      role="alert"
    >
      {children}
    </p>
  )
}

export function FormSuccessBanner({ children, className = "" }) {
  if (!children) return null
  return (
    <p
      className={`rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ${className}`}
      role="status"
    >
      {children}
    </p>
  )
}
