const deleted = Symbol.for('deleted')

function isObjectLike (value: any) {
  return typeof value === 'object' && value !== null
}

export function deleteValue<T> (value: T): T {
  if (isObjectLike(value)) {
    return {
      ...value,
      [deleted]: true
    }
  } else {
    return value
  }
}

export function restoreValue<T> (value: T): T {
  if (isObjectLike(value)) {
    return {
      ...value,
      [deleted]: false
    }
  } else {
    return value
  }
}

export function isDeleted (value: any): boolean {
  return isObjectLike(value)
    ? value[deleted] === true
    : value === null
}
