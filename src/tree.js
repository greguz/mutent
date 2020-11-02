import { writeStatus } from './driver/writer'
import {
  commitStatus,
  deleteStatus,
  shouldCommit,
  updateStatus
} from './status'
import { unlazy } from './utils'

async function handleUpdateNode(status, node) {
  return updateStatus(status, await node.mutate(status.target))
}

async function handleConditionalNode(status, node, writer, options) {
  const ok = unlazy(node.condition, status.target)
  if (!ok) {
    return status
  } else {
    return mutateStatus(status, node.mutation, writer, options)
  }
}

export async function mutateStatus(status, tree, writer, options) {
  for (const node of tree) {
    switch (node.type) {
      case 'COMMIT':
        if (writer && shouldCommit(status)) {
          status = await writeStatus(status, writer, options)
        } else {
          status = commitStatus(status)
        }
        break
      case 'CONDITION':
        status = await handleConditionalNode(status, node, writer, options)
        break
      case 'DELETE':
        status = deleteStatus(status)
        break
      case 'UPDATE':
        status = await handleUpdateNode(status, node)
        break
      default:
        throw new Error(`Unknown mutation type: ${node.type}`)
    }
  }
  return status
}
