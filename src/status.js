import { MutentError } from './error'

export function commitStatus({ deleted, target }) {
  return {
    created: false,
    updated: false,
    deleted: false,
    source: deleted ? null : target,
    target
  }
}

export function createStatus(data) {
  return {
    created: true,
    updated: false,
    deleted: false,
    source: null,
    target: data
  }
}

export function readStatus(data) {
  return commitStatus(createStatus(data))
}

export function updateStatus({ created, deleted, source }, target) {
  if (target === null || target === undefined) {
    throw new MutentError(
      'EMUT_NULLISH_UPDATE',
      'Cannot accpet nullish values as entity update',
      { data: source }
    )
  }
  return {
    created,
    updated: true,
    deleted,
    source,
    target
  }
}

export function deleteStatus({ created, updated, source, target }) {
  return {
    created,
    updated,
    deleted: true,
    source,
    target
  }
}

export function shouldCreate({ created, deleted, source }) {
  return source === null && created && !deleted
}

export function shouldUpdate({ deleted, source, updated }) {
  return source !== null && updated && !deleted
}

export function shouldDelete({ deleted, source }) {
  return source !== null && deleted
}

export function shouldCommit(status) {
  return shouldCreate(status) || shouldUpdate(status) || shouldDelete(status)
}
