import { writeStatus } from '../driver/writer'
import {
  commitStatus,
  deleteStatus,
  shouldCommit,
  updateStatus
} from '../status'
import { unlazy } from '../utils'

import { NODE_TYPE } from './nodes'

async function handleUpdateNode(status, { mutator }) {
  return updateStatus(status, await mutator(status.target))
}

async function handleConditionalNode(
  status,
  { condition, tree },
  writer,
  options
) {
  const ok = unlazy(condition, status.target)
  if (!ok) {
    return status
  } else {
    return mutateStatus(status, tree, writer, options)
  }
}

export async function mutateStatus(status, tree, writer, options) {
  for (const node of tree) {
    switch (node.type) {
      case NODE_TYPE.COMMIT:
        if (writer && shouldCommit(status)) {
          status = await writeStatus(status, writer, options)
        } else {
          status = commitStatus(status)
        }
        break
      case NODE_TYPE.CONDITION:
        status = await handleConditionalNode(status, node, writer, options)
        break
      case NODE_TYPE.DELETE:
        status = deleteStatus(status)
        break
      case NODE_TYPE.UPDATE:
        status = await handleUpdateNode(status, node)
        break
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }
  return status
}
