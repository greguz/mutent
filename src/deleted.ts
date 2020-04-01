const deleted = Symbol.for('deleted')

function isObjectLike (value: any) {
  return typeof value === 'object' && value !== null
}

export function deleteValue<T> (value: T): T {
  if (isObjectLike(value)) {
    (value as any)[deleted] = true
  }
  return value
}

export function restoreValue<T> (value: T): T {
  if (isObjectLike(value)) {
    (value as any)[deleted] = false
  }
  return value
}

export function isDeleted (value: any): boolean {
  return isObjectLike(value)
    ? value[deleted] === true
    : value === null
}
