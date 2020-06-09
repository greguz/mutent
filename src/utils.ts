export type MaybePromise<T> = Promise<T> | T

export const mutentSymbol = Symbol.for('mutent')

export function isUndefined (value: any): value is undefined | void {
  return value === undefined
}

export function isNull (value: any): value is null {
  return value === null
}

export function isNil (value: any): value is null | undefined | void {
  return isNull(value) || isUndefined(value)
}

export function objectify<O> (value?: O): Partial<O> {
  return typeof value === 'object' && !isNull(value) ? value : {}
}
