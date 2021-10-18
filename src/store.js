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
    this._commitMode = 'AUTO'
    this._hooks = normalizeHooks({})
    this._mutators = []
    this._name = name || readAdapterName(adapter) || 'anonymous'
    this._writeMode = 'AUTO'
    this._writeSize = 16

    this.extend({ commitMode, hooks, mutators, writeMode, writeSize })
  }

  create (data) {
    return this.mutation('CREATE', data)
  }

  extend (options) {
    const {
      commitMode,
      hooks,
      mutators,
      writeMode,
      writeSize
    } = Object(options)

    if (commitMode !== undefined) {
      this._commitMode = parseCommitMode(commitMode)
    }
    if (hooks !== undefined) {
      this._hooks = mergeHooks(this._hooks, normalizeHooks(hooks))
    }
    if (mutators !== undefined) {
      this._mutators = this._mutators.concat(normalizeMutators(mutators))
    }
    if (writeMode !== undefined) {
      this._writeMode = parseWriteMode(writeMode)
    }
    if (writeSize !== undefined) {
      this._writeSize = parseWriteSize(writeSize)
    }

    return this
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
