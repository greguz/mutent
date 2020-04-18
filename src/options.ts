function isObjectLike (value: any): value is object {
  return typeof value === 'object' && value !== null
}

export function objectify<O> (value?: O): Partial<O> {
  return isObjectLike(value)
    ? value
    : {}
}

export function defaults<O> (
  target: Partial<O>,
  source?: O
): Partial<O> {
  return {
    ...objectify(source),
    ...target
  }
}
