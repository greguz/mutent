export const mutentSymbol = Symbol.for('mutent')

export function isUndefined (value: any): value is undefined {
  return value === undefined
}

export function isNull (value: any): value is null {
  return value === null
}

export function objectify<O> (value?: O): Partial<O> {
  return typeof value === 'object' && !isNull(value) ? value : {}
}
