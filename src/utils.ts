export const mutentSymbol = Symbol.for('mutent')

export function isUndefined (value: any): value is undefined {
  return value === undefined
}

export function isNull (value: any): value is null {
  return value === null
}

export function isObjectLike (value: any): value is object {
  return typeof value === 'object' && !isNull(value)
}

export function objectify<O> (value?: O): Partial<O> {
  return isObjectLike(value)
    ? value
    : {}
}
