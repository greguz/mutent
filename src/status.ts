export interface Status<S, T, O> {
  source: S,
  target: T
  options?: O
}

function noUndef<T> (value: T): T {
  if (value === undefined) {
    throw new Error('An entity cannot be undefined')
  }
  return value
}

export function createStatus<T, O> (
  value: T,
  options?: O
): Status<null, T, O> {
  return {
    source: null,
    target: noUndef(value),
    options
  }
}

export function updateStatus<S, T, O, V> (
  status: Status<S, T, O>,
  value: V
): Status<S, V, O> {
  return {
    source: status.source,
    target: noUndef(value),
    options: status.options
  }
}

export function commitStatus<T, O> (
  status: Status<any, T, O>
): Status<T, T, O> {
  return {
    source: status.target,
    target: status.target,
    options: status.options
  }
}
