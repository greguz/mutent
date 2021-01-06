import { deleteStatus, updateStatus } from './status'

export function _delete() {
  return deleteStatus
}

export function commit() {
  return function commitMutator(status, options) {
    return this.driver.write(status, options)
  }
}

function isTrue(condition, data) {
  return typeof condition === 'function' ? condition(data) : condition
}

export function _if(condition, ...mutators) {
  return async function conditionalMutator(status, options) {
    if (isTrue(condition, status.target)) {
      for (const mutator of mutators) {
        status = await mutator.call(this, status, options)
      }
    }
    return status
  }
}

export function unless(condition, ...mutators) {
  return _if(data => !isTrue(condition, data), ...mutators)
}

export function update(mapper) {
  return async function updateMutator(status) {
    return updateStatus(status, await mapper(status.target))
  }
}

export function tap(tapper) {
  return async function tapMutator(status) {
    await tapper(status.target)
    return status
  }
}
