import { Status, commitStatus } from './status'

export type Commit<O = unknown, C = unknown> = (
  this: C,
  source: any,
  target: any,
  options?: O
) => any

export interface Plugin<O = unknown, C = unknown> {
  create? (this: C, target: any, options?: O): any
  update? (this: C, source: any, target: any, options?: O): any
  delete? (this: C, source: any, options?: O): any
}

export type Driver<O = unknown, C = unknown> = Commit<O, C> | Plugin<O, C>

export type Handler<O> = <T>(status: Status<any, T>, options?: O) => Promise<Status<T, T>>

async function execCommit<T, O, C> (
  context: C,
  commit: Commit<O, C>,
  status: Status<any, T>,
  options?: O
): Promise<Status<T, T>> {
  const { source, target }: Status<any, any> = status
  if (source !== target) {
    await commit.call(context, source, target, options)
  }
  return commitStatus(status)
}

function bindCommit<O, C> (
  context: C,
  commit: Commit<O, C>
): Handler<O> {
  return function (status, options) {
    return execCommit(context, commit, status, options)
  }
}

function noop (this: any) {
  // nothing to do
}

function reducePlugin<O, C> (plugin: Plugin<O, C>): Commit<O, C> {
  const pCreate: any = plugin.create || noop
  const pUpdate: any = plugin.update || noop
  const pDelete: any = plugin.delete || noop

  return function (source, target, options) {
    if (source === null) {
      return pCreate.call(this, target, options)
    } else if (target === null) {
      return pDelete.call(this, source, options)
    } else {
      return pUpdate.call(this, source, target, options)
    }
  }
}

export function bindDriver<O, C> (
  context: C,
  driver?: Driver<O, C>
): Handler<O> {
  if (typeof driver === 'function') {
    return bindCommit(context, driver)
  } else if (typeof driver === 'object') {
    return bindCommit(context, reducePlugin(driver))
  } else {
    return status => Promise.resolve(commitStatus(status))
  }
}
