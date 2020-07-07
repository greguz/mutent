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

export function objectify<T> (value?: T): Partial<T> {
  return typeof value === 'object' && !isNull(value) ? value : {}
}

export function defaults (a: any, b: any): any {
  return Object.keys(b).reduce(
    (acc, key) => {
      if (isUndefined(acc[key])) {
        acc[key] = b[key]
      }
      return acc
    },
    a
  )
}
