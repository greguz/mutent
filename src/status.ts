export interface Status<S, T> {
  source: S,
  target: T
}

function noUndef<T> (value: T): T {
  if (value === undefined) {
    throw new Error('An entity cannot be undefined')
  }
  return value
}

export function createStatus<T> (value: T): Status<null, T> {
  return {
    source: null,
    target: noUndef(value)
  }
}

export function updateStatus<S, T, V> (
  status: Status<S, T>,
  value: V
): Status<S, V> {
  return {
    source: status.source,
    target: noUndef(value)
  }
}

export function commitStatus<T> (
  status: Status<any, T>
): Status<T, T> {
  return {
    source: status.target,
    target: status.target
  }
}
