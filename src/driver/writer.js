import { commitStatus, updateStatus } from '../status'
import { isNil, isNull } from '../utils'

function close(status, data) {
  return commitStatus(isNil(data) ? status : updateStatus(status, data))
}

export async function writeStatus(status, writer, options = {}) {
  if (isNull(status.source) && status.created && !status.deleted) {
    if (writer.create) {
      return close(status, await writer.create(status.target, options))
    }
  } else if (!isNull(status.source) && status.updated && !status.deleted) {
    if (writer.update) {
      return close(
        status,
        await writer.update(status.source, status.target, options)
      )
    }
  } else if (!isNull(status.source) && status.deleted) {
    if (writer.delete) {
      return close(status, await writer.delete(status.source, options))
    }
  }
  return close(status)
}
