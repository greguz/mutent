import { writeStatus } from './adapter'
import { deleteStatus, updateStatus } from './status'
import { unlazy } from './utils'

const NODE_TYPE = {
  COMMIT: 0,
  CONDITION: 1,
  DELETE: 2,
  UPDATE: 3
}

export function nodeCommit() {
  return {
    type: NODE_TYPE.COMMIT
  }
}

export function nodeCondition(condition, tree) {
  return {
    type: NODE_TYPE.CONDITION,
    condition,
    tree
  }
}

export function nodeDelete() {
  return {
    type: NODE_TYPE.DELETE
  }
}

export function nodeUpdate(mutator) {
  return {
    type: NODE_TYPE.UPDATE,
    mutator
  }
}

async function handleUpdateNode(status, { mutator }) {
  return updateStatus(status, await mutator(status.target))
}

async function handleConditionalNode(
  status,
  { condition, tree },
  adapter,
  options
) {
  const ok = unlazy(condition, status.target)
  if (!ok) {
    return status
  } else {
    return mutateStatus(status, tree, adapter, options)
  }
}

export async function mutateStatus(status, tree, adapter, options) {
  for (const node of tree) {
    switch (node.type) {
      case NODE_TYPE.COMMIT:
        status = writeStatus(adapter, status, options)
        break
      case NODE_TYPE.CONDITION:
        status = await handleConditionalNode(status, node, adapter, options)
        break
      case NODE_TYPE.DELETE:
        status = deleteStatus(status)
        break
      case NODE_TYPE.UPDATE:
        status = await handleUpdateNode(status, node)
        break
    }
  }
  return status
}
