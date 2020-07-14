export type MaybePromise<T> = Promise<T> | T

export function isUndefined (value: any): value is undefined | void {
  return value === undefined
}

export function isNull (value: any): value is null {
  return value === null
}

export function isNil (value: any): value is null | undefined | void {
  return isNull(value) || isUndefined(value)
}

export function objectify (value?: any): any {
  return typeof value === 'object' && !isNull(value) ? value : {}
}
