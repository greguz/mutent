export interface Status<T> {
  source: T | null,
  target: T
}

function noUndef<T> (value: T): T {
  if (value === undefined) {
    throw new Error('An entity cannot be undefined')
  }
  return value
}

export function createStatus<T> (target: T): Status<T> {
  return {
    source: null,
    target: noUndef(target)
  }
}

export function updateStatus<T> (
  status: Status<T>,
  target: T
): Status<T> {
  return {
    source: status.source,
    target: noUndef(target)
  }
}

export function commitStatus<T> (
  status: Status<T>
): Status<T> {
  return {
    source: status.target,
    target: status.target
  }
}

export function unwrapStatus<T> (
  status: Status<T>
): T {
  return status.target
}
