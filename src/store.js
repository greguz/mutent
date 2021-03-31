import { Engine } from './engine'
import { MutentError } from './error'
import { mutatorMigrate } from './migration'
import { Mutation } from './mutation'

function ensureEngine(options) {
  const { engine } = options
  return engine || Engine.create(options)
}

async function* mutatorHook(iterable, options) {
  for await (const status of iterable) {
    await this.hooks.onData(this.intent, status.target, options)
    yield status
  }
}

async function* mutatorSchema(iterable) {
  for await (const status of iterable) {
    if (!this.validate(status.target)) {
      throw new MutentError(
        'EMUT_INVALID_ENTITY',
        'Current entity does not match the configured schema',
        {
          data: status.target,
          errors: this.validate.errors,
          intent: this.intent,
          store: this.store
        }
      )
    }
    yield status
  }
}

function handleSchema(iterable, options) {
  const mutentOptions = options.mutent || {}
  return mutentOptions.ignoreSchema
    ? iterable
    : mutatorSchema.call(this, iterable, options)
}

export class Store {
  static create(options) {
    return new Store(options)
  }

  constructor(options) {
    const {
      adapter,
      commitMode = 'AUTO',
      hooks = {},
      migrationStrategies = {},
      name,
      schema = null,
      version = null,
      versionKey = 'v',
      writeMode = 'AUTO',
      writeSize = 16
    } = options

    if (!name) {
      throw new Error('Store name is required')
    }
    if (!adapter) {
      throw new Error('Adapter is required')
    }

    const engine = ensureEngine(options)
    const validate = schema ? engine.compile(schema) : null

    this.name = name
    this.version = version

    this._context = {
      adapter,
      commitMode,
      hooks,
      migrationStrategies,
      multiple: null,
      schema,
      store: name,
      validate,
      version,
      versionKey,
      writeMode,
      writeSize
    }

    this._mutators = []
    if (hooks.onData) {
      this._mutators.push(mutatorHook)
    }
    if (version !== null) {
      this._mutators.push(mutatorMigrate)
    }
    if (validate) {
      this._mutators.push(handleSchema)
    }
  }

  create(data) {
    return new Mutation(
      {
        ...this._context,
        argument: data,
        intent: 'CREATE'
      },
      this._mutators
    )
  }

  find(query) {
    return new Mutation(
      {
        ...this._context,
        argument: query,
        intent: 'FIND'
      },
      this._mutators
    )
  }

  read(query) {
    return new Mutation(
      {
        ...this._context,
        argument: query,
        intent: 'READ'
      },
      this._mutators
    )
  }

  filter(query) {
    return new Mutation(
      {
        ...this._context,
        argument: query,
        intent: 'FILTER'
      },
      this._mutators
    )
  }

  from(data) {
    return new Mutation(
      {
        ...this._context,
        argument: data,
        intent: 'FROM'
      },
      this._mutators
    )
  }
}
