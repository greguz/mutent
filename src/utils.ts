export type Result<T> = Promise<T> | T

export type Lazy<T, A> = ((arg: A) => T) | T

export function unlazy<T, A> (lazy: Lazy<T, A>, arg: A): T {
  return typeof lazy === 'function' ? (lazy as any)(arg) : lazy
}

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
