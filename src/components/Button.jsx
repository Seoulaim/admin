import { buttonClass } from './buttonClass.js'

function Button({
  variant = 'outline',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant, size)} ${className}`}
      {...props}
    />
  )
}

export default Button
