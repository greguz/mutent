const knownHooks = [
  'onFind',
  'onFilter',
  'onEntity',
  'beforeCreate',
  'beforeUpdate',
  'beforeDelete',
  'afterCreate',
  'afterUpdate',
  'afterDelete'
]

export function normalizeHooks (raw) {
  raw = Object(raw)
  const hooks = {}
  for (const key of knownHooks) {
    const value = raw[key]
    if (Array.isArray(value)) {
      hooks[key] = value
    } else if (typeof value === 'function') {
      hooks[key] = [value]
    } else if (value === undefined) {
      hooks[key] = []
    } else {
      throw new TypeError(`Invalid ${key} hook definition`)
    }
  }
  return hooks
}

export function mergeHooks (oldHooks, newHooks) {
  const resHooks = {}
  for (const key of knownHooks) {
    resHooks[key] = oldHooks[key].concat(newHooks[key])
  }
  return resHooks
}

export function normalizeMutators (mutators = []) {
  if (!Array.isArray(mutators)) {
    throw new TypeError('Invalid mutators')
  }
  return mutators
}

export function parseCommitMode (value = 'AUTO') {
  if (
    value !== 'AUTO' &&
    value !== 'MANUAL' &&
    value !== 'SAFE'
  ) {
    throw new Error(`Unknown commit mode ${value}`)
  }
  return value
}

export function parseWriteMode (value = 'AUTO') {
  if (
    value !== 'AUTO' &&
    value !== 'BULK' &&
    value !== 'CONCURRENT' &&
    value !== 'SEQUENTIAL'
  ) {
    throw new Error(`Unknown commit mode ${value}`)
  }
  return value
}

export function parseWriteSize (value = 16) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError('Write size must be a positive integer')
  }
  return value
}
