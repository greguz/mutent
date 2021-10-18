import { readAdapterName } from './adapter'
import { Mutation } from './mutation'
import {
  mergeHooks,
  normalizeHooks,
  normalizeMutators,
  parseCommitMode,
  parseWriteMode,
  parseWriteSize
} from './options'

export class Store {
  constructor (options) {
    const {
      adapter,
      commitMode,
      hooks,
      mutators,
      name,
      writeMode,
      writeSize
    } = Object(options)

    if (!adapter) {
      throw new Error('Adapter is required')
    }

    this._adapter = adapter
    this._commitMode = parseCommitMode(commitMode)
    this._hooks = normalizeHooks(hooks)
    this._mutators = normalizeMutators(mutators)
    this._name = name || readAdapterName(adapter) || 'anonymous'
    this._writeMode = parseWriteMode(writeMode)
    this._writeSize = parseWriteSize(writeSize)
  }

  create (data) {
    return this.mutation('CREATE', data)
  }

  extend ({ commitMode, hooks, mutators, writeMode, writeSize }) {
    return new Store({
      adapter: this._adapter,
      commitMode: commitMode === undefined ? this._commitMode : commitMode,
      hooks: mergeHooks(this._hooks, normalizeHooks(hooks)),
      mutators: this._mutators.concat(normalizeMutators(mutators)),
      name: this._name,
      writeMode: writeMode === undefined ? this._writeMode : writeMode,
      writeSize: writeSize === undefined ? this._writeSize : writeSize
    })
  }

  filter (query) {
    return this.mutation('FILTER', query)
  }

  find (query) {
    return this.mutation('FIND', query)
  }

  from (data) {
    return this.mutation('FROM', data)
  }

  mutation (intent, argument) {
    return new Mutation({
      adapter: this._adapter,
      argument,
      commitMode: this._commitMode,
      hooks: this._hooks,
      intent,
      mutators: this._mutators,
      store: this._name,
      writeMode: this._writeMode,
      writeSize: this._writeSize
    })
  }

  read (query) {
    return this.mutation('READ', query)
  }
}
